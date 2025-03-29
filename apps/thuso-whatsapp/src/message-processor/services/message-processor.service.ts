import { LoggingService } from '@lib/logging';
import { MessageProcessorRMQMessage } from '@lib/thuso-common/message-queue-types';
import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { MessageProcessingStateMachineProvider } from '../state-machines/message-processing.state-machine.provider';
import { AnyActorRef, waitFor } from 'xstate';
import { AccountDataService } from './account-data.service';

@Injectable()
export class MessageProcessorService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly messageProcessingStateMachineProvider: MessageProcessingStateMachineProvider,
        private readonly accountDataService: AccountDataService
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

        if (accountData.disabled || !accountData.subscriptionEndDate || accountData.subscriptionEndDate < new Date()) {
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

        // process message
        const msgProcessingActor = this.messageProcessingStateMachineProvider.getMachineActor({
            message: payload.message,
            metadata: payload.metadata,
            contact: payload.contact,
            wabaId: accountData.wabaId,
            businessInfo: {
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
}
