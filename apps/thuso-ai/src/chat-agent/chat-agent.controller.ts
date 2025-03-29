import { LoggingService } from '@lib/logging';
import { LLMEventPattern, LLMQueueMessage } from '@lib/thuso-common';
import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { ChatAgentService } from './chat-agent.service';
import { Logger } from 'winston';

@Controller('chat-agent')
export class ChatAgentController {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly chatAgentService: ChatAgentService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "chat-agent",
            file: "chat-agent.controller"
        })

        this.logger.info("Initialised ChatAgentController")
    }

    @EventPattern(LLMEventPattern)
    async processMessage(payload: LLMQueueMessage) {
        await this.chatAgentService.processMessage(payload)
    }
}
