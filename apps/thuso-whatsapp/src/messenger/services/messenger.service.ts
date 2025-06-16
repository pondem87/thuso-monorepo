import { LoggingService } from '@lib/logging';
import { CampaignMessageStatusUpdateEventPattern, CampaignMessageStatusUpdatePayload, MessengerRMQMessage, WhatsAppMessageStatusUpdatePayload } from '@lib/thuso-common';
import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { MessengerProcessStateMachineProvider } from '../state-machines/messenger-process.state-machine.provider';
import { AnyActorRef, waitFor } from 'xstate';
import { InjectRepository } from '@nestjs/typeorm';
import { SentMessage } from '../entities/sent-message.entity';
import { Repository } from 'typeorm';
import { ThusoClientProxiesService } from '@lib/thuso-client-proxies';

@Injectable()
export class MessengerService {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly messengerProcessStateMachineProvider: MessengerProcessStateMachineProvider,
        @InjectRepository(SentMessage)
        private readonly sentMessageRepository: Repository<SentMessage>,
        private readonly clientService: ThusoClientProxiesService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "messenger",
            file: "messenger.service"
        })

        this.logger.info("Initialised MessengerService")
    }

    /**
     * Processes a message from the RabbitMQ queue sent from whatsapp module.
     * This method retrieves the appropriate state machine actor for processing client messages,
     * starts the actor, and waits for it to reach a final state.
     * @param payload - The message payload containing the necessary data for processing.
     * @return {Promise<void>} - A promise that resolves when the message processing is complete.
     */
    async processMessage(payload: MessengerRMQMessage) {
        const mpsmActor = this.messengerProcessStateMachineProvider.getMachineActor({ payload })
        mpsmActor.start()
        await waitFor(
            mpsmActor as AnyActorRef,
            (snapshot) => snapshot.hasTag('final')
        )
        
        if (mpsmActor.getSnapshot().hasTag('failure')) {
            this.logger.error("Error processing message", { context: mpsmActor.getSnapshot().context })                                
        }
    }

    /**
     * Processes a WhatsApp message status update.
     * This method updates the status of a sent message in the database
     * and emits an event if the message is part of a campaign to allow campaign message tracking.
     * @param data - The WhatsApp message status update payload.
     * @return {Promise<void>} - A promise that resolves when the status update is processed.
     */
    async processWhatsappMessageStatusUpdate(data: WhatsAppMessageStatusUpdatePayload) {
        try {
            const message = await this.sentMessageRepository.findOneBy({ wamid: data.status.id })
            if (message) {
                message.status = data.status.status;
                await this.sentMessageRepository.save(message);

                if (message.campaignId) {
                    this.clientService.emitMgntQueue(
                        CampaignMessageStatusUpdateEventPattern,
                        {
                            campaignId: message.campaignId,
                            messageId: message.wamid,
                            status: data.status.status
                        } as CampaignMessageStatusUpdatePayload
                    )
                }
            }
        } catch (error) {
            this.logger.error("Error processing WhatsApp message status update", { error, data });
        }
    }
}
