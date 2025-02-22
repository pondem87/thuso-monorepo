import { LoggingService } from '@lib/logging';
import { MessageProcessorRMQMessage } from '@lib/thuso-common/message-queue-types';
import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';

@Injectable()
export class MessageProcessorService {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "message-processor.service"
        })

        this.logger.info("Message Processor service initialized.")
    }

    processNoContactsMessage(payload: MessageProcessorRMQMessage) {
        throw new Error('Method not implemented.');
    }

    processMessage(payload: MessageProcessorRMQMessage) {
        throw new Error('Method not implemented.');
    }
}
