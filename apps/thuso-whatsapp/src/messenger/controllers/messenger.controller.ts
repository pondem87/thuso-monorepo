import { MessengerEventPattern, MessengerRMQMessage } from '@lib/thuso-common';
import { Controller } from '@nestjs/common';
import { Logger } from 'winston';
import { MessengerService } from '../services/messenger.service';
import { EventPattern } from '@nestjs/microservices';
import { LoggingService } from '@lib/logging';

@Controller('messenger')
export class MessengerController {
    private logger: Logger

    constructor(
        private readonly messengerService: MessengerService,
        private readonly loggingService: LoggingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "messenger",
            file: "messenger.controller"
        })

        this.logger.info("Initialised MessengerController")
    }

    @EventPattern(MessengerEventPattern)
    async processMassage(payload: MessengerRMQMessage) {
        return this.messengerService.processMessage(payload)
    }
}
