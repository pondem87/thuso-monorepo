import { LoggingService } from '@lib/logging';
import { Controller } from '@nestjs/common';
import { Logger } from 'winston';
import { MessageProcessorService } from '../services/message-processor.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AccountDataUpdatePayload, AccountUpdateMessageProcessorPattern, BusinessProfileUpdateMessageProcessorPattern, BusinessProfileUpdatePayload, BusinessUpdateMessageProcessorPattern, ContactlessMessageProcessorEventPattern, MessageProcessorEventPattern, MessageProcessorRMQMessage, WhatsAppBusinessUpdatePayload } from '@lib/thuso-common';
import { AccountDataService } from '../services/account-data.service';

@Controller('message-processor')
export class MessageProcessorController {
    private logger: Logger

    constructor(
        private readonly messageProcessorService: MessageProcessorService,
        private readonly loggingService: LoggingService,
        private readonly accountDataService: AccountDataService
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

    @EventPattern(AccountUpdateMessageProcessorPattern)
    processAccountUpdate(
        @Payload() data: AccountDataUpdatePayload
    ) {
        return this.accountDataService.processAccountUpdate(data)
    }

    @EventPattern(BusinessUpdateMessageProcessorPattern)
    processBusinessUpdate(
        @Payload() data: WhatsAppBusinessUpdatePayload
    ) {
        return this.accountDataService.processBusinessUpdate(data)
    }

    @EventPattern(BusinessProfileUpdateMessageProcessorPattern)
    processBusinessProfileUpdate(
        @Payload() data: BusinessProfileUpdatePayload
    ) {
        return this.accountDataService.processProfileUpdate(data)
    }
}
