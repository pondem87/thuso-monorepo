import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { DeleteObjectCommand, PutObjectCommand, S3Client, S3ClientConfig } from "@aws-sdk/client-s3"
import { LoggingService } from '@lib/logging';
import { ConfigService } from '@nestjs/config';
import { generateS3Key, IMAGE_MIMETYPES, WHATSAPP_MIMETYPES } from '@lib/thuso-common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';

@Injectable()
export class ProductsService {
    private logger: Logger
    private s3Client: S3Client
    private s3BucketName: string
    private mimeTypes = WHATSAPP_MIMETYPES

    constructor(
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>
    ) {
        this.logger = this.loggingService.getLogger({
            module: "products",
            file: "products.controller"
        })

        this.logger.info("Products Service initialized")

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

    async createProduct(accountId: string, data: CreateProductDto, file: Express.Multer.File) {
        if (!file) {
            throw new HttpException("No file selected for upload", HttpStatus.BAD_REQUEST)
        }

        if (!this.mimeTypes.includes(file.mimetype)) {
            this.logger.warn("File type not allowed", { accountId, mimetype: file.mimetype })
            throw new HttpException(`File type not allowed. Allowed types are ${this.mimeTypes}`, HttpStatus.NOT_ACCEPTABLE)
        }

        try {
            const type = IMAGE_MIMETYPES.includes(file.mimetype) ? "image" : "document"
            const key = generateS3Key(type, accountId, file.originalname)

            await this.uploadFile(file.buffer, key)

            return this.productRepository.save(
                this.productRepository.create({
                    accountId,
                    ...data,
                    mimetype: file.mimetype,
                    s3key: key
                })
            )
        } catch (error) {
            this.logger.error("Error while uploading file", { accountId, error })
            throw new HttpException(`Error while uploading file`, HttpStatus.INTERNAL_SERVER_ERROR)
        }

    }

    async getProduct(accountId: string, id: string) {
        try {
            return await this.productRepository.findOneOrFail({ where: { accountId, id } })
        } catch (error) {
            // Check if the error is due to the entity not being found
            if (error instanceof EntityNotFoundError) {
                this.logger.debug("Product not found", { accountId, error });
                throw new HttpException("Product not found", HttpStatus.NOT_FOUND);
            }

            this.logger.error("Error while getting document", { accountId, error })
            throw new HttpException(`Error while getting document`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async editProduct(accountId: string, id: string, data: CreateProductDto, file?: Express.Multer.File) {

        if (file) {
            if (!this.mimeTypes.includes(file.mimetype)) {
                this.logger.error("File type not allowed", { accountId, mimetype: file.mimetype })
                throw new HttpException(`File type not allowed. Allowed types are ${this.mimeTypes}`, HttpStatus.NOT_ACCEPTABLE)
            }
        }

        try {
            const prod = await this.productRepository.findOne({ where: { accountId, id } })
            if (!prod) throw new Error("No such document")

            const keys = Object.keys(data)

            for (const key of keys) {
                prod[key] = data[key]
            }

            if (file) {
                await this.replaceFile(file.buffer, prod.s3key)
                prod.mimetype = file.mimetype
            }

            return await this.productRepository.save(prod)

        } catch (error) {
            this.logger.error("Error while uploading file", { accountId, error })
            throw new HttpException(`Error while uploading file`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async listProducts(accountId: string, skip?: number | undefined, take?: number | undefined) {
        try {
            return await this.productRepository.findAndCount({ where: { accountId }, skip, take })
        } catch (error) {
            this.logger.error("Error while uploading file", { accountId, error })
            throw new HttpException(`Error while uploading file`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async deleteProduct(accountId: string, id: string) {
        try {
            const prod = await this.productRepository.findOne({ where: { accountId, id } })
            if (!prod) throw new Error("No such document")

            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.s3BucketName,
                    Key: prod.s3key
                })
            )

            return await this.productRepository.delete({ accountId, id })

        } catch (error) {
            this.logger.error("Failed to delete document", error)
            throw new Error(error.detail ? error.detail : "Document delete failed")
        }
    }

    async replaceFile(buffer: Buffer, key: string): Promise<{ key: string }> {
        try {
            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.s3BucketName,
                    Key: key
                })
            )

            return this.uploadFile(buffer, key)
        } catch (error) {
            this.logger.error("Failed to delete S3 file", error)
            throw new Error(error.detail ? error.detail : "S3 file delete failed")
        }
    }

    async uploadFile(buffer: Buffer, key: string): Promise<{ key: string }> {
        try {
            await this.s3Client.send(
                new PutObjectCommand({
                    Bucket: this.s3BucketName,
                    Key: key,
                    Body: buffer
                })
            )

            return { key }
        } catch (error) {
            this.logger.error("Failed to upload file to S3", error)
            throw new Error(error.detail ? error.detail : "S3 file upload failed")
        }
    }
}
