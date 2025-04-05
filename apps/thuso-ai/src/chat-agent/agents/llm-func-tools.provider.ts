import { DynamicStructuredTool } from "@langchain/core/tools";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { z } from "zod"
import { EmbeddingMetadata } from "../../embedding/vector-store.provider";
import { EmbeddingService } from "../../embedding/embedding.service";
import { LoggingService } from "@lib/logging";
import { Contact } from "@lib/thuso-common";

@Injectable()
export class LLMFuncToolsProvider {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly embeddingService: EmbeddingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "llm-tools",
            file: "llm-func-tools.provider"
        })

        this.logger.info("Initializing LLMToolsProvider")
    }

    getTools(contact: Contact, businessProfileId: string): DynamicStructuredTool[] {
        return [
            this.searchCompanyDocumentsTool({ businessProfileId }),
            this.applicationActionsTool()
        ]
    }

    applicationActionsTool(): DynamicStructuredTool {
        return new DynamicStructuredTool({
            func: async (input) => {
                return `Action: "${input.action}" will be implemented by downstream application.`
            },
            name: "take-action",
            description:`When human requests action in this list:\n
                         1. send main menu => to view options for products, services and promotions`,
            schema: z.object({
                action: z.string().describe("action requested")
            })
        })
    }

    searchCompanyDocumentsTool(params: Partial<EmbeddingMetadata>): DynamicStructuredTool {
        return new DynamicStructuredTool({
            name: "document-search-tool",
            description: "Search for relevant information from company documents.",
            func: async (input) => {

                this.logger.debug("Called web search function.", { input })
                const docs = await this.embeddingService.searchEmbeddings(input.searchQuery, params)
                return docs.map(doc => `Content:${doc.pageContent}\nMetadata: ${JSON.stringify(doc.metadata)}`).join("\n\n")
            },
            schema: z.object({
                searchQuery: z.string().describe("Prompt to use for similarity search"),
            })
        })
    }
}
