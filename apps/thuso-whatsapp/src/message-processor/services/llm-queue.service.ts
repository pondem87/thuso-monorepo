import { LoggingService } from "@lib/logging";
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies";
import { Contact, LLMEventPattern, LLMQueueMessage, Metadata } from "@lib/thuso-common";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";

@Injectable()
export class LLMQueueService {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly clientsService: ThusoClientProxiesService
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

        this.clientsService.emitLlmQueue(
            LLMEventPattern,
            payload
        )
    }
}