import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoggingService } from '@lib/logging';
import { DeleteResult, EntityNotFoundError, ILike, Repository } from 'typeorm';
import { MediaFile } from '../entities/media.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from 'winston';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { generateS3Key, getFileCategory, WHATSAPP_RESUMABLE_MIMETYPES } from '@lib/thuso-common';
import { CreateMediaDto } from '../dto/create-media.dto';
import { EditMediaDto } from '../dto/edit-media.dto';
import { ThusoClientProxiesService } from '@lib/thuso-client-proxies';

@Injectable()
export class MediaService {
    private logger: Logger
    private s3Client: S3Client
    private s3BucketName: string

    constructor(
        private readonly loggingService: LoggingService,
        @InjectRepository(MediaFile)
        private readonly mediaFileRepo: Repository<MediaFile>,
        private readonly configService: ConfigService,
        private readonly clientsService: ThusoClientProxiesService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "media",
            file: "media.service"
        })

        this.logger.info("Initialised Media service")

        const s3Config: S3ClientConfig = {
            credentials: {
                accessKeyId: this.configService.get<string>("S3_ACCESS_KEY_ID"), // 'your-access-key-id'
                secretAccessKey: this.configService.get<string>("S3_SECRET_ACCESS_KEY"), // 'your-secret-access-key'
            },
            region: this.configService.get<string>("S3_REGION"), // 'region',
        }

        this.s3Client = new S3Client(s3Config);
        this.s3BucketName = this.configService.get<string>("S3_BUCKET_NAME")
    }

    async getMedia(accountId: string, mediaId: string): Promise<MediaFile> {
        try {
            return await this.mediaFileRepo.findOneOrFail({ where: { accountId, id: mediaId } })
        } catch (error) {
            if (error instanceof EntityNotFoundError) throw new HttpException("File not found", HttpStatus.NOT_FOUND)
            this.logger.error("Error while getting media file", { error, accountId })
            throw new HttpException("Error while getting file", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async listMedia(accountId: string, skip?: number | undefined, take?: number | undefined, search?: string | undefined): Promise<[MediaFile[], number]> {
        try {
            let where: any;

            if (search) {
                where = [
                    { accountId, filename: ILike(`%${search}%`) },
                    { accountId, description: ILike(`%${search}%`) },
                ];
            } else {
                where = { accountId };
            }

            return await this.mediaFileRepo.findAndCount({ where, skip, take })
        } catch (error) {
            this.logger.error("Error while retrieving document list", { accountId, error })
            throw new HttpException(`Error while retrieving document list`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async createMedia(accountId: string, dto: CreateMediaDto): Promise<{ file: MediaFile, uploadUrl: string }> {
        if (!WHATSAPP_RESUMABLE_MIMETYPES.includes(dto.mimetype)) {
            this.logger.warn("File type not allowed", { accountId, mimetype: dto.mimetype })
            throw new HttpException(`File type not allowed. Allowed types are ${WHATSAPP_RESUMABLE_MIMETYPES}`, HttpStatus.NOT_ACCEPTABLE)
        }

        try {
            const fileKind = getFileCategory(dto.mimetype)
            const s3key = generateS3Key(fileKind, accountId, dto.filename)
            const file = await this.mediaFileRepo.save(
                this.mediaFileRepo.create({
                    accountId,
                    ...dto,
                    s3Key: s3key
                })
            )

            const uploadUrl = await this.getS3UploadUrl(file.s3Key, file.mimetype)
            return { file, uploadUrl }
        } catch (error) {
            this.logger.error("Error while creating media file", { error, accountId })
            throw new HttpException("Failed to create file", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async editMedia(accountId: string, mediaId: string, dto: EditMediaDto): Promise<{ file: MediaFile, uploadUrl?: string }> {
        if (dto.mimetype && !WHATSAPP_RESUMABLE_MIMETYPES.includes(dto.mimetype)) {
            this.logger.warn("File type not allowed", { accountId, mimetype: dto.mimetype })
            throw new HttpException(`File type not allowed. Allowed types are ${WHATSAPP_RESUMABLE_MIMETYPES}`, HttpStatus.NOT_ACCEPTABLE)
        }

        try {
            let file = await this.mediaFileRepo.findOneOrFail({ where: { id: mediaId } })
            let uploadUrl
            if (dto.filename && dto.fileSize && dto.mimetype) {
                // replace upload
                await this.deleteS3Object(file.s3Key)
                const fileKind = getFileCategory(dto.mimetype)
                const s3key = generateS3Key(fileKind, accountId, dto.filename)
                uploadUrl = await this.getS3UploadUrl(s3key, dto.mimetype)
            }

            for (const key in Object.keys(dto)) {
                file[key] = dto[key]
            }

            file = await this.mediaFileRepo.save(file)

            return { file, uploadUrl }
        } catch (error) {
            if (error instanceof EntityNotFoundError) throw new HttpException("File not found", HttpStatus.NOT_FOUND)
            this.logger.error("Error while editing media file", { error, accountId })
            throw new HttpException("Error while editing file", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async deleMedia(accountId: string, mediaId: string): Promise<DeleteResult> {
        try {
            const file = await this.mediaFileRepo.findOneOrFail({ where: { accountId, id: mediaId } })
            await this.deleteS3Object(file.s3Key)
            return await this.mediaFileRepo.delete(file)
        } catch (error) {
            if (error instanceof EntityNotFoundError) throw new HttpException("File not found", HttpStatus.NOT_FOUND)
            this.logger.error("Error while editing media file", { error, accountId })
            throw new HttpException("Error while editing file", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getMediaLink(accountId: string, mediaId: string): Promise<string> {
        try {
            const file = await this.mediaFileRepo.findOneOrFail({ where: { accountId, id: mediaId } })
            return await getSignedUrl(
                this.s3Client,
                new GetObjectCommand({
                    Bucket: this.s3BucketName,
                    Key: file.s3Key
                })
            )
        } catch (error) {
            if (error instanceof EntityNotFoundError) throw new HttpException("File not found", HttpStatus.NOT_FOUND)
            this.logger.error("Error while getting link for media file", { error, accountId })
            throw new HttpException("Error while getting link for media file", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getS3UploadUrl(key: string, mimetype: string): Promise<string> {
        try {
            return await getSignedUrl(this.s3Client, new PutObjectCommand({
                Bucket: this.s3BucketName,
                Key: key,
                ContentType: mimetype
            }), { expiresIn: 900 })
        } catch (error) {
            this.logger.error("Failed to upload file to S3", error)
            throw new Error(error.detail ? error.detail : "S3 file upload failed")
        }
    }

    async deleteS3Object(key: string): Promise<void> {
        try {
            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.s3BucketName,
                    Key: key
                })
            )
        } catch (error) {
            this.logger.error("Failed to delete S3 object", error)
            throw new Error(error.detail ? error.detail : "S3 object delete failed")
        }
    }
}
