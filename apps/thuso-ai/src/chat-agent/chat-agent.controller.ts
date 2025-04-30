import { LoggingService } from '@lib/logging';
import { AccountDataUpdatePayload, AccountUpdateChatAgentPattern, BusinessProfileUpdateChatAgentPattern, BusinessProfileUpdatePayload, BusinessUpdateChatAgentPattern, CustomerRegistrationChatAgentEventPattern, CustomerRegistrationChatAgentEventPayload, LLMEventPattern, LLMQueueMessage, WhatsAppBusinessUpdatePayload } from '@lib/thuso-common';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ChatAgentService } from './chat-agent.service';
import { Logger } from 'winston';
import { BusinessProfileService } from './services/business-profile.service';
import { ChatMessageHistoryService } from './chat-message-history/chat-message-history.service';

@Controller('chat-agent')
export class ChatAgentController {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly chatAgentService: ChatAgentService,
        private readonly businessProfileService: BusinessProfileService,
        private readonly chatMessageHistoryService: ChatMessageHistoryService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "chat-agent",
            file: "chat-agent.controller"
        })

        this.logger.info("Initialised ChatAgentController")
    }

    @EventPattern(LLMEventPattern)
    processMessage(payload: LLMQueueMessage) {
        return this.chatAgentService.processMessage(payload)
    }

    @EventPattern(AccountUpdateChatAgentPattern)
    processAccountUpdate(
        @Payload() data: AccountDataUpdatePayload
    ) {
        this.logger.debug("Unimplemented account update handler", { accountId: data.accountData.id, event: data.event })
    }

    @EventPattern(BusinessUpdateChatAgentPattern)
    processBusinessUpdate(
        @Payload() data: WhatsAppBusinessUpdatePayload
    ) {
        this.logger.debug("Received business update message", data)
        return this.businessProfileService.processBusinessUpdate(data)
    }

    @EventPattern(BusinessProfileUpdateChatAgentPattern)
    processBusinessProfileUpdate(
        @Payload() data: BusinessProfileUpdatePayload
    ) {
        this.logger.debug("Received profile update message", { data })
        return this.businessProfileService.processProfileUpdateService(data)
    }

    @EventPattern(CustomerRegistrationChatAgentEventPattern)
    processCustomerRegistration(
        @Payload() data: CustomerRegistrationChatAgentEventPayload
    ) {
        this.logger.debug("Received message: CustomerRegistrationChatAgentEventPattern")
        return this.chatMessageHistoryService.processRegistration(data)
    }
}
