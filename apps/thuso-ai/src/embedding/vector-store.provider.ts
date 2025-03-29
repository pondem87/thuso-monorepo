import { Injectable } from "@nestjs/common";
import { OpenAIEmbeddings } from "@langchain/openai";
import {
    DistanceStrategy,
    PGVectorStore,
} from "@langchain/community/vectorstores/pgvector";
import { PoolConfig } from "pg";
import { ConfigService } from "@nestjs/config";
import { Document } from "@langchain/core/documents";
import * as fs from "fs";
import { Logger } from "winston";
import { LoggingService } from "@lib/logging";

export class EmbeddingMetadata {
    documentId: string
    businessProfileId: string
    accountId: string
    s3key: string
    mimetype: string
}

@Injectable()
export class PostgresVectorStore {

    private pgVectorStore
    private pgvconfig
    private logger: Logger
    private similaritySearchResultCount: number

    constructor(
        private readonly config: ConfigService,
        private readonly loggingService: LoggingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "Whatsapp",
            file: "vector-store"
        })

        this.logger.info("Constructing vector store")

        this.pgvconfig = {
            postgresConnectionOptions: {
                type: this.config.get<string>("DB_TYPE"),
                host: this.config.get<string>("DB_HOST"),
                port: this.config.get<number>("DB_PORT"),
                user: this.config.get<string>("DB_USERNAME"),
                password: this.config.get<string>("DB_PASSWORD"),
                database: this.config.get<string>("EMBEDDINGS_DB_NAME"),
                ssl: {
                    ca: fs.readFileSync(this.config.get<string>("DB_CERT_PATH"))
                }
            } as PoolConfig,
            tableName: "document_embeddings",
            columns: {
                idColumnName: "id",
                vectorColumnName: "vector",
                contentColumnName: "content",
                metadataColumnName: "metadata",
            },
            // supported distance strategies: cosine (default), innerProduct, or euclidean
            distanceStrategy: "cosine" as DistanceStrategy,
        }

        this.pgVectorStore = null
        this.similaritySearchResultCount = parseInt(this.config.get<string>("SIMILARITY_SEARCH_RESULT_COUNT")) || 5
    }

    async initVectorStore(): Promise<PGVectorStore> {

        this.pgVectorStore = await PGVectorStore.initialize(
            new OpenAIEmbeddings(),
            this.pgvconfig
        )

        return this.pgVectorStore
    }

    async getVectorStore(): Promise<PGVectorStore> {
        if (this.pgVectorStore) return this.pgVectorStore
        else return this.initVectorStore()
    }

    async addDocuments(documents: Document[], metadata: EmbeddingMetadata) {
        if (this.pgVectorStore == null) await this.initVectorStore()

        this.logger.debug("Adding embeddings", { metadata })

        var documents_edit = documents.map((doc) => {
            doc.metadata = {
                ...doc.metadata,
                ...metadata
            }

            return doc
        })

        await this.pgVectorStore.addDocuments(documents_edit);
    }

    async similaritySearch(input: string, metadata: Partial<EmbeddingMetadata>): Promise<Document[]> {
        if (this.pgVectorStore == null) await this.initVectorStore()

        this.logger.debug("Running similarity search on embeddings.", { context: { input, metadata } })

        try {
            return await this.pgVectorStore.similaritySearch(input, this.similaritySearchResultCount, metadata);
        } catch (error) {
            this.logger.error("Func:similaritySearch => Failed to retrieve business documents.", error)
            return [new Document({ pageContent: "Failed to retrieve business documents", metadata: metadata })]
        }

    }

    async deleteEmbeddings(metadata: Partial<EmbeddingMetadata>) {
        if (this.pgVectorStore == null) await this.initVectorStore()

        this.logger.debug("Deleting embeddings", { metadata })

        try {

            await this.pgVectorStore.delete({
                filter: {
                    ...metadata
                },
            });
        }

        catch (error) {
            this.logger.error(
                "Failed to delete embeddings",
                error
            )
        }
    }

}