import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client, S3ClientConfig } from "@aws-sdk/client-s3"
import { LoggingService } from '@lib/logging';
import { ConfigService } from '@nestjs/config';
import { CreateDocumentDto } from './dto/create-document.dto';
import { generateS3Key, VECTOR_DOCS_MIMETYPES } from '@lib/thuso-common';
import { InjectRepository } from '@nestjs/typeorm';
import { Document } from './entity/document.entity';
import { EntityNotFoundError, Repository } from 'typeorm';
import { CreateEmbeddingDto } from './dto/create-embedding.dto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EditDocumentDto } from './dto/edit-document.dto';

@Injectable()
export class DocumentsService {
    private logger: Logger
    private s3Client: S3Client
    private s3BucketName: string
    private mimeTypes = VECTOR_DOCS_MIMETYPES
    private aiServerRoot: string

    constructor(
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService,
        @InjectRepository(Document)
        private readonly documentRepository: Repository<Document>
    ) {
        this.logger = this.loggingService.getLogger({
            module: "documents",
            file: "documents.controller"
        })

        this.logger.info("Documents Service initialized")

        const s3Config: S3ClientConfig = {
            credentials: {
                accessKeyId: this.configService.get<string>("S3_ACCESS_KEY_ID"), // 'your-access-key-id'
                secretAccessKey: this.configService.get<string>("S3_SECRET_ACCESS_KEY"), // 'your-secret-access-key'
            },
            region: this.configService.get<string>("S3_REGION"), // 'region',
        }

        this.s3Client = new S3Client(s3Config);
        this.s3BucketName = this.configService.get<string>("S3_BUCKET_NAME")
        this.aiServerRoot = `http://${this.configService.get<string>("AI_SERVER_URL")}:${this.configService.get<string>("AI_SERVER_PORT")}`
    }

    async createDocument(accountId: string, data: CreateDocumentDto): Promise<{ file: Document, uploadUrl: string }> {
        if (!this.mimeTypes.includes(data.mimetype)) {
            this.logger.warn("File type not allowed", { accountId, mimetype: data.mimetype })
            throw new HttpException(`File type not allowed. Allowed types are ${this.mimeTypes}`, HttpStatus.NOT_ACCEPTABLE)
        }

        try {
            const key = generateS3Key("document", accountId, data.filename)

            const file = await this.documentRepository.save(
                this.documentRepository.create({
                    accountId,
                    ...data,
                    s3key: key,
                    embedded: false
                })
            )

            const uploadUrl = await this.getS3UploadUrl(file.s3key, file.mimetype)

            return { file, uploadUrl }
           
        } catch (error) {
            this.logger.error("Error while uploading file", { accountId, error })
            throw new HttpException(`Error while uploading file`, HttpStatus.INTERNAL_SERVER_ERROR)
        }

    }

    async embedDocument(accountId: string, id: string) {
        try {
            const doc = await this.documentRepository.findOneOrFail({ where: { accountId, id } })

            const dto: CreateEmbeddingDto = {
                accountId,
                businessProfileId: doc.businessProfileId,
                documentId: doc.id,
                s3key: doc.s3key,
                mimetype: doc.mimetype
            }

            const result = await fetch(`${this.aiServerRoot}/ai/embedding`,
                {
                    method: "POST",
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dto)
                }
            )

            if (result.ok && (await result.json()).success) {
                doc.embedded = true
                await this.documentRepository.save(doc)
            }

            return { success: doc.embedded }

        } catch (error) {
            this.logger.error("Failed to create document embeddings", { accountId, documentId: id, error })
            return { success: false }
        }
    }

    async getDownloadLink(accountId: string, id: string): Promise<string> {
        try {
            const doc = await this.documentRepository.findOneOrFail({ where: { accountId, id } })
            return await getSignedUrl(this.s3Client, new GetObjectCommand({
                Bucket: this.s3BucketName,
                Key: doc.s3key
            }), { expiresIn: 900 })
        } catch (error) {
            // Check if the error is due to the entity not being found
            if (error instanceof EntityNotFoundError) {
                this.logger.debug("Document not found", { accountId, error });
                throw new HttpException("Document not found", HttpStatus.NOT_FOUND);
            }

            this.logger.error("Error while getting document download link", { accountId, error })
            throw new HttpException(`Error while getting document download link`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getDocument(accountId: string, id: string) {
        try {
            return await this.documentRepository.findOneOrFail({ where: { accountId, id } })
        } catch (error) {
            // Check if the error is due to the entity not being found
            if (error instanceof EntityNotFoundError) {
                this.logger.debug("Document not found", { accountId, error });
                throw new HttpException("Document not found", HttpStatus.NOT_FOUND);
            }

            this.logger.error("Error while getting document", { accountId, error })
            throw new HttpException(`Error while getting document`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async editDocument(accountId: string, id: string, data: EditDocumentDto): Promise<{file: Document, uploadUrl: string}> {
        if (data.mimetype && !this.mimeTypes.includes(data.mimetype)) {
            this.logger.error("File type not allowed", { accountId, mimetype: data.mimetype })
            throw new HttpException(`File type not allowed. Allowed types are ${this.mimeTypes}`, HttpStatus.NOT_ACCEPTABLE)
        }

        try {
            let file = await this.documentRepository.findOne({ where: { accountId, id } })
            if (!file) throw new Error("No such document")

            let uploadUrl

            if (data.filename && data.mimetype) {
                file.mimetype = data.mimetype
                file.embedded = false

                // delete embedding
                const pdto: Partial<CreateEmbeddingDto> = {
                    accountId,
                    businessProfileId: file.businessProfileId,
                    documentId: file.id,
                }

                await fetch(`${this.aiServerRoot}/ai/embedding`,
                    {
                        method: "DELETE",
                        headers: {
                            'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(pdto)
                    }
                )

                file.embedded = false

                // delete file
                await this.deleteS3Object(file.s3key)
                file.s3key = generateS3Key("document", accountId, data.filename)
                uploadUrl = await this.getS3UploadUrl(file.s3key, data.mimetype)
            }

            const keys = Object.keys(data)

            for (const key of keys) {
                file[key] = data[key]
            }
            
            file = await this.documentRepository.save(file)

            return {file, uploadUrl}
        } catch (error) {
            this.logger.error("Error while uploading file", { accountId, error })
            throw new HttpException(`Error while uploading file`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async listDocuments(accountId: string, skip?: number | undefined, take?: number | undefined) {
        try {
            return await this.documentRepository.findAndCount({ where: { accountId }, skip, take })
        } catch (error) {
            this.logger.error("Error while retrieving document list", { accountId, error })
            throw new HttpException(`Error while retrieving document list`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async deleteDocument(accountId: string, id: string) {
        try {
            const doc = await this.documentRepository.findOne({ where: { accountId, id } })
            if (!doc) throw new Error("No such document")

            await this.deleteS3Object(doc.s3key)

            // delete embedding
            const pdto: Partial<CreateEmbeddingDto> = {
                accountId,
                businessProfileId: doc.businessProfileId,
                documentId: doc.id,
            }

            await fetch(`${this.aiServerRoot}/ai/embedding`,
                {
                    method: "DELETE",
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(pdto)
                }
            )

            return await this.documentRepository.delete({ accountId, id })

        } catch (error) {
            this.logger.error("Failed to delete document", error)
            throw new Error(error.detail ? error.detail : "Document delete failed")
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
