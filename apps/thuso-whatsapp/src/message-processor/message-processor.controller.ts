import { LoggingService } from '@lib/logging';
import { Controller } from '@nestjs/common';
import { Logger } from 'winston';
import { MessageProcessorService } from './services/message-processor.service';
import { EventPattern } from '@nestjs/microservices';
import { ContactlessMessageProcessorEventPattern, MessageProcessorEventPattern, MessageProcessorRMQMessage } from '@lib/thuso-common';

@Controller('message-processor')
export class MessageProcessorController {
    private logger: Logger

    constructor(
        private readonly messageProcessorService: MessageProcessorService,
        private readonly loggingService: LoggingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "message-processor.controller"
        })

        this.logger.info("Message Processor controller initialized.")
    }

    @EventPattern(MessageProcessorEventPattern)
    async processMessage(payload: MessageProcessorRMQMessage) {
        await this.messageProcessorService.processMessage(payload)
    }

    @EventPattern(ContactlessMessageProcessorEventPattern)
    async processNoContactsMessage(payload: MessageProcessorRMQMessage) {
        await this.messageProcessorService.processNoContactsMessage(payload)
    }
}
