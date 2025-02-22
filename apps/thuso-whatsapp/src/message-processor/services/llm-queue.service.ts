import { LoggingService } from "@lib/logging";
import { Contact, LLMEventPattern, LLMQueueMessage, LlmRmqClient, Metadata } from "@lib/thuso-common";
import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Logger } from "winston";

@Injectable()
export class LLMQueueService {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        @Inject(LlmRmqClient)
        private readonly llmQueueClient: ClientProxy
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "llm-queue.service"
        })

        this.logger.info("Initializing LLMQueueService")
    }

    sendPlainTextToLLM(wabaId: string, metadata: Metadata, contact: Contact, prompt: string): void {
        const payload: LLMQueueMessage = {
            wabaId,
            metadata,
            contact,
            prompt
        }

        this.llmQueueClient.emit(
            LLMEventPattern,
            payload
        )
    }
}