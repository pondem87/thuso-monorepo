import { DynamicStructuredTool } from "@langchain/core/tools";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { z } from "zod"
import { EmbeddingMetadata } from "../../embedding/vector-store.provider";
import { EmbeddingService } from "../../embedding/embedding.service";
import { LoggingService } from "@lib/logging";
import { Contact, RegisterCustomerEventPayload, RegisterCustomerToCRMEventPattern } from "@lib/thuso-common";
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies";

@Injectable()
export class LLMFuncToolsProvider {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly embeddingService: EmbeddingService,
        private readonly clientsService: ThusoClientProxiesService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "llm-tools",
            file: "llm-func-tools.provider"
        })

        this.logger.info("Initializing LLMToolsProvider")
    }

    getTools(contact: Contact, accountId: string, businessProfileId: string): DynamicStructuredTool[] {
        return [
            this.searchCompanyDocumentsTool({ businessProfileId }),
            this.applicationActionsTool(),
            this.saveCustomerDataTool(contact, accountId)
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

    saveCustomerDataTool(contact: Contact, accountId: string): DynamicStructuredTool {
        return new DynamicStructuredTool({
            name: "save-customer-data-tool",
            description: "Save customer data for service optimisation.",
            func: async (input) => {

                this.logger.debug("Called save customer data function.", { input })
                this.clientsService.emitMgntQueue(
                    RegisterCustomerToCRMEventPattern,
                    {
                        accountId,
                        ...input,
                        whatsAppNumber: contact.wa_id
                    } as RegisterCustomerEventPayload
                )
                return "Customer data sent to CRM, status will update shortly."
            },
            schema: z.object({
                forenames: z.string().describe("Customer's given names"),
                surname: z.string().describe("Customer's family name"),
                streetAd: z.string().optional().describe("Street address of the customer (optional)"),
                city: z.string().describe("City where the customer resides"),
                country: z.string().describe("Country where the customer resides"),
                age: z.number().optional().describe("Age of the customer in years"),
                gender: z.enum(['male', 'female']).describe("Gender of the customer"),
                email: z.string().email().optional().describe("Email address of the customer (optional)")
            })
        })
    }
}
