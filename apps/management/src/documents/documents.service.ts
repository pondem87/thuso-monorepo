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
import { Response as Res } from 'express';
import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';
import { CreateEmbeddingDto } from './dto/create-embedding.dto';

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

    async createDocument(accountId: string, data: CreateDocumentDto, file: Express.Multer.File) {
        if (!file) {
            throw new HttpException("No file selected for upload", HttpStatus.BAD_REQUEST)
        }

        if (!this.mimeTypes.includes(file.mimetype)) {
            this.logger.warn("File type not allowed", { accountId, mimetype: file.mimetype })
            throw new HttpException(`File type not allowed. Allowed types are ${this.mimeTypes}`, HttpStatus.NOT_ACCEPTABLE)
        }

        try {
            const key = generateS3Key("document", accountId, file.originalname)

            await this.uploadFile(file.buffer, key)

            const doc = await this.documentRepository.save(
                this.documentRepository.create({
                    accountId,
                    ...data,
                    mimetype: file.mimetype,
                    s3key: key,
                    embedded: false
                })
            )

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
            }

            return this.documentRepository.save(doc)
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

    async editDocument(accountId: string, id: string, data: CreateDocumentDto, file?: Express.Multer.File) {

        if (file) {
            if (!this.mimeTypes.includes(file.mimetype)) {
                this.logger.error("File type not allowed", { accountId, mimetype: file.mimetype })
                throw new HttpException(`File type not allowed. Allowed types are ${this.mimeTypes}`, HttpStatus.NOT_ACCEPTABLE)
            }
        }

        try {
            const doc = await this.documentRepository.findOne({ where: { accountId, id } })
            if (!doc) throw new Error("No such document")

            const keys = Object.keys(data)

            for (const key of keys) {
                doc[key] = data[key]
            }

            if (file) {
                await this.replaceFile(file.buffer, doc.s3key)
                doc.mimetype = file.mimetype
                doc.embedded = false

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


                // create embedding
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
                }
            }


            return await this.documentRepository.save(doc)

        } catch (error) {
            this.logger.error("Error while uploading file", { accountId, error })
            throw new HttpException(`Error while uploading file`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async listDocuments(accountId: string, skip?: number | undefined, take?: number | undefined) {
        try {
            return await this.documentRepository.findAndCount({ where: { accountId }, skip, take })
        } catch (error) {
            this.logger.error("Error while uploading file", { accountId, error })
            throw new HttpException(`Error while uploading file`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async deleteDocument(accountId: string, id: string) {
        try {
            const doc = await this.documentRepository.findOne({ where: { accountId, id } })
            if (!doc) throw new Error("No such document")

            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.s3BucketName,
                    Key: doc.s3key
                })
            )

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

    async downloadDocument(key: string, res: Res) {
        try {
            const { Body } = await this.s3Client.send(
                new GetObjectCommand({
                    Bucket: this.s3BucketName,
                    Key: key
                })
            )

            Readable.fromWeb(Body.transformToWebStream() as ReadableStream).pipe(res)
            
        } catch (error) {
            res.status(500).send('Error downloading file');
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
