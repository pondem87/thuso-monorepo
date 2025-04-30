import { AccountDataUpdatePayload, AccountUpdateMessengerPattern, BusinessProfileUpdateMessengerPattern, BusinessProfileUpdatePayload, BusinessUpdateMessengerPattern, MessengerEventPattern, MessengerRMQMessage, WhatsAppBusinessUpdatePayload } from '@lib/thuso-common';
import { Controller } from '@nestjs/common';
import { Logger } from 'winston';
import { MessengerService } from '../services/messenger.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { LoggingService } from '@lib/logging';
import { WhatsAppBusinessService } from '../services/whatsapp-business.service';

@Controller('messenger')
export class MessengerController {
    private logger: Logger

    constructor(
        private readonly messengerService: MessengerService,
        private readonly loggingService: LoggingService,
        private readonly whatsAppBusinessService: WhatsAppBusinessService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "messenger",
            file: "messenger.controller"
        })

        this.logger.info("Initialised MessengerController")
    }

    @EventPattern(MessengerEventPattern)
    async processMassage(payload: MessengerRMQMessage) {
        this.logger.debug("Received MessengerEventPattern:", {payload})
        return this.messengerService.processMessage(payload)
    }

    @EventPattern(AccountUpdateMessengerPattern)
    processAccountUpdate(
        @Payload() data: AccountDataUpdatePayload
    ) {
        this.logger.debug("Received MessengerEventPattern:", {data})
        return this.whatsAppBusinessService.processAccountUpdate(data)
    }

    @EventPattern(BusinessUpdateMessengerPattern)
    processBusinessUpdate(
        @Payload() data: WhatsAppBusinessUpdatePayload
    ) {
        this.logger.debug("Received MessengerEventPattern:", {data})
        return this.whatsAppBusinessService.processBusinessUpdate(data)
    }

    @EventPattern(BusinessProfileUpdateMessengerPattern)
    processBusinessProfileUpdate(
        @Payload() data: BusinessProfileUpdatePayload
    ) {
        this.logger.debug("Received MessengerEventPattern:", {data})
        return this.whatsAppBusinessService.processProfileUpdate(data)
    }
}
