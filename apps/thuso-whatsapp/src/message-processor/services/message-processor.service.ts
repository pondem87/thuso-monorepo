import { LoggingService } from '@lib/logging';
import { MessageProcessorRMQMessage, MessengerRMQMessage, StopPromotionsEventPayload } from '@lib/thuso-common/message-queue-types';
import { Injectable, ParseUUIDPipe } from '@nestjs/common';
import { Logger } from 'winston';
import { MessageProcessingStateMachineProvider } from '../state-machines/message-processing.state-machine.provider';
import { AnyActorRef, waitFor } from 'xstate';
import { AccountDataService } from './account-data.service';
import { ThusoClientProxiesService } from '@lib/thuso-client-proxies';
import { MessengerEventPattern, StopPromotionsEventPattern } from '@lib/thuso-common';

@Injectable()
export class MessageProcessorService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly messageProcessingStateMachineProvider: MessageProcessingStateMachineProvider,
        private readonly accountDataService: AccountDataService,
        private readonly clientService: ThusoClientProxiesService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "message-processor.service"
        })

        this.logger.info("Message Processor service initialized.")
    }

    async processNoContactsMessage(payload: MessageProcessorRMQMessage) {
        this.logger.warn("Contactless message received", { payload })
    }

    async processMessage(payload: MessageProcessorRMQMessage) {
        // get account data
        const accountData = await this.accountDataService.getAccountData(
            payload.wabaId,
            payload.metadata.phone_number_id
        )

        if (!accountData) {
            this.logger.debug("Cannot process message. Failed to get account data for the waba_id", { payload })
            return
        }

        if (accountData.disabled || !accountData.subscriptionEndDate || accountData.subscriptionEndDate.getTime() < Date.now()) {
            // no active subscription
            this.logger.warn("Cannot process message. Account disabled or subscription expired", {
                payload,
                accountData: {
                    id: accountData.id,
                    accountId: accountData.accountId,
                    disabled: accountData.disabled,
                    subscriptionEndDate: accountData.subscriptionEndDate
                }
            })

            return
        }

        // global actions do not require a state machine
        if (this.isGlobalReplyButton(accountData.accountId, payload)) {
            return
        }

        // process message
        const msgProcessingActor = this.messageProcessingStateMachineProvider.getMachineActor({
            message: payload.message,
            metadata: payload.metadata,
            contact: payload.contact,
            wabaId: accountData.wabaId,
            businessInfo: {
                accountId: accountData.id,
                name: accountData.businessName,
                tagline: accountData.tagline,
                wabaToken: accountData.wabaToken
            }
        })

        msgProcessingActor.start()

        await waitFor(
            msgProcessingActor as AnyActorRef,
            (state) => state.matches("ProcessSuccess") || state.matches("ProcessFailure")
        )

        if (msgProcessingActor.getSnapshot().matches("ProcessFailure")) {
            // handle failure
            this.logger.error("Message processing failed", {
                accountId: accountData.accountId,
                wabaId: accountData.wabaId,
                snapshot: msgProcessingActor.getSnapshot()
            })
        }
    }

    isGlobalReplyButton(accountId: string, payload: MessageProcessorRMQMessage): boolean {
        if (payload.message.type === "button") {
            switch (payload.message.button.text) {
                case "Stop promotions":
                    // client doesnt want to receive promotional messages
                    // send message to crm to stop promotions
                    this.clientService.emitMgntQueue(
                        StopPromotionsEventPattern,
                        {
                            whatsAppNumber: payload.contact.wa_id,
                            accountId,
                            wabaId: payload.wabaId
                        } as StopPromotionsEventPayload
                    )

                    // send message back to customer with acknowledgement
                    this.clientService.emitWhatsappQueue(
                        MessengerEventPattern,
                        {
                            metadata: payload.metadata,
                            contact: payload.contact,
                            type: "text",
                            text: "Thank you for your feedback. We wont be sending you any more promotional messages. Feel free to contact us for any other enquiries.",
                            conversationType: "marketing",
                            wabaId: payload.wabaId
                        } as MessengerRMQMessage
                    )

                    return true;

                default:
            }
        }
        return false;
    }
}
