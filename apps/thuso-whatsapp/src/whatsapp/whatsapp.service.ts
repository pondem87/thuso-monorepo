import { LoggingService } from '@lib/logging';
import { ThusoClientProxiesService } from '@lib/thuso-client-proxies';
import { ContactlessMessageProcessorEventPattern, MessageProcessorEventPattern, TemplateQualityEventPattern, TemplateQualityEventPayload, TemplateStatusUpdate, TemplateUpdateEventPattern, TemplateUpdateEventPayload, WhatsappMessageStatusUpdateEventPattern, WhatsAppMessageStatusUpdatePayload, WhatsAppWebhookPayload } from '@lib/thuso-common';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';

@Injectable()
export class WhatsappService {
    private logger: Logger
    private verifyToken: string

    constructor (
        private readonly clientService: ThusoClientProxiesService,
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "whatsapp",
            file: "whatsapp.service"
        })

        this.logger.info("Whatsapp service initialized.")

        this.verifyToken = this.configService.get<string>("WEBHOOK_VERIFY_TOKEN")
    }

    processWhatsappHookPayload(payload: WhatsAppWebhookPayload) {
        this.logger.debug("processing WebhookPayloadDto")

        if (!(payload?.object && payload.object == "whatsapp_business_account")) {
            this.logger.error("Invalid payload:", payload)
            throw new HttpException("Invalid payload!", HttpStatus.BAD_REQUEST)
        }

        try {
            payload.entry.forEach(entry => {

                const wabaId = entry.id

                entry.changes.forEach(change => {
                    if (change.field == "messages") {

                        if (change.value.messages) {
                            if (change.value.contacts) {
                                change.value.messages.forEach((message, index) => {
                                    this.clientService.emitWhatsappQueue(MessageProcessorEventPattern, {
                                        wabaId,
                                        contact: change.value.contacts[index],
                                        metadata: change.value.metadata,
                                        message
                                    })
                                })
                            } else {
                                change.value.messages.forEach((message) => {
                                    this.clientService.emitWhatsappQueue(ContactlessMessageProcessorEventPattern, {
                                        wabaId,
                                        metadata: change.value.metadata,
                                        message
                                    })
                                })
                            }
                        }

                        if (change.value.statuses) {
                            change.value.statuses.forEach(status => {
                                this.clientService.emitWhatsappQueue(
                                    WhatsappMessageStatusUpdateEventPattern,
                                    {
                                        wabaId,
                                        status,
                                        metadata: change.value.metadata
                                    } as WhatsAppMessageStatusUpdatePayload
                                )
                            })
                        }

                        if (change.value.errors) {
                            change.value.errors.forEach(error => {
                                this.logger.warn("Unhandled webhook error notification", { data: error })
                            })
                        }
                    } else if (change.field === "message_template_status_update") {
                        this.clientService.emitMgntQueue(
                            TemplateUpdateEventPattern,
                            {
                                wabaId,
                                update: change.value   
                            } as TemplateUpdateEventPayload
                        )
                    }  else if (change.field === "message_template_quality_update") {
                        this.clientService.emitMgntQueue(
                            TemplateQualityEventPattern,
                            {
                                wabaId,
                                update: change.value   
                            } as TemplateQualityEventPayload
                        )
                    } else {
                        this.logger.warn("Unhandled webhook change", { data: change })
                    }
                })
            })

            return "OK"

        } catch (error) {
            this.logger.error("Failed to process webhook payload:", { payload, error })
            throw new HttpException("Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    verifyWhatsAppWebhook(hubMode: string, hubVerifyToken: string, hubChallenge: number) {
        this.logger.info("Attempting webhook verification")

        if (hubMode == "subscribe" && hubVerifyToken === this.verifyToken) {
            this.logger.info("Successful webhook verification")
            return hubChallenge
        } else {
            this.logger.warn("Attempting Webhook verification")
            throw new HttpException("VerifyToken could not be verified", HttpStatus.NOT_ACCEPTABLE)
        }
    }
}
