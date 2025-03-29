import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateEmbeddingDto } from './dto/create-embedding.dto';
import { Logger } from 'winston';
import { LoggingService } from '@lib/logging';
import { EmbeddingMetadata, PostgresVectorStore } from './vector-store.provider';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { CHARACTER_TEXT_SPLITTING_CHUNK, CHARACTER_TEXT_SPLITTING_OVERLAP } from '@lib/thuso-common';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import * as mammoth from "mammoth";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { Blob } from 'node:buffer';

@Injectable()
export class EmbeddingService {
    private logger: Logger
    private s3Client: S3Client
    private s3BucketName: string

    constructor(
        private readonly loggingService: LoggingService,
        private readonly vectorStore: PostgresVectorStore,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "embedding",
            file: "embedding.controller"
        })

        this.logger.info("Embedding Service initialised")

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

    async embedDocument(dto: CreateEmbeddingDto): Promise<{ success: boolean}> {
        try {
            const { Body } = await this.s3Client.send(
                new GetObjectCommand({
                    Bucket: this.s3BucketName,
                    Key: dto.s3key
                })
            )

            const fileBlob = new Blob([(await Body.transformToByteArray()).buffer])

            let documents: Document[]
        
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: CHARACTER_TEXT_SPLITTING_CHUNK,
                chunkOverlap: CHARACTER_TEXT_SPLITTING_OVERLAP,
            });

            switch (dto.mimetype) {
                case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                    const arrayBuffer = await fileBlob.arrayBuffer();
                    documents = await splitter.splitDocuments([
                        new Document({
                          pageContent: (await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) })).value,
                          metadata: { ...dto }
                        })
                      ])          
                    break;
    
                case "application/pdf":
                    documents = await splitter.splitDocuments(await new PDFLoader(fileBlob).load())
                    break;
    
                case "text/plain":
                    documents = await splitter.splitDocuments(await new TextLoader(fileBlob).load())
                    break;
            
                default:
                    this.logger.warn("File type not supported for embeddings.", { ...dto })
                    throw new HttpException("File type not supported.", HttpStatus.BAD_REQUEST)
            }

            await this.vectorStore.addDocuments(
                documents,
                {
                    ...dto
                }
            )

            return { success: true }

        } catch (error) {
            this.logger.error("Failed embedding", { ...dto, error })
            return { success: false }
        }
    }

    async deleteEmbedding(dto: Partial<CreateEmbeddingDto>): Promise<{ success: boolean}> {
        try {
            await this.vectorStore.deleteEmbeddings(dto)
            return { success: true}
        } catch (error) {
            this.logger.error("Failed to delete embedding", { ...dto, error })
            return { success: false }
        }
    }

    async searchEmbeddings(input: string, metadata: Partial<EmbeddingMetadata>): Promise<Document[]> {
        return this.vectorStore.similaritySearch(input, metadata)
    }
}
