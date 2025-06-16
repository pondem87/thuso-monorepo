import { LoggingService } from "@lib/logging";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { ISMContext, ISMEventType } from "../state-machines/interactive.state-machine.provider";
import { sendListMessage, sendTextMessage } from "./shared";
import { CHAR_LIMITS, cropTextToLength, InteractiveList, ResumeWhatsAppPromoEventPattern, ResumeWhatsAppPromoEventPayload, ResumeWhatsAppUpdatesEventPattern } from "@lib/thuso-common";
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies";

@Injectable()
export class PreferencesStateService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly clientsService: ThusoClientProxiesService
    ) {
        this.logger = this.loggingService.getLogger({
            file: "preferences-state.service",
            module: "message-processor"
        })
    }

    promptPreferencesMenuState = async ({ context }: { context: ISMContext }): Promise<void> => {
        sendListMessage(context, this.clientsService, this.makeMenuInteractiveList(context))
    }

    executeProductsMenuItem = async ({ context }: { context: ISMContext }): Promise<ISMEventType> => {
        const message = context.message
        if (message == null) {
            this.logger.error("message cannot be null in executePreferencesMenuItem({ context }: { context: ISMContext})")
            throw new Error("message cannot be null in executePreferencesMenuItem({ context }: { context: ISMContext})")
        }

        switch (message.type) {
            case "interactive":
                switch (message.interactive.type) {
                    case "list_reply":
                        // menu selection
                        switch (message.interactive.list_reply.id) {
                            case resumePromoId:
                                return { type: "receivePromoMessages" }
                            case resumeUpdatesId:
                                return { type: "receiveUpdateMessages" }
                            case exitPrefsId:
                                sendTextMessage(context, this.clientsService, "You have exited the preferences menu.")
                                return { type: "exitPreferences" }
                            default:
                        }
                    default:
                        sendTextMessage(context, this.clientsService, `Sorry, the message you sent is not valid. Select an option from Preferences Menu.`)
                        return { type: "nochange" }
                }

            default:
                sendTextMessage(context, this.clientsService, `Sorry, the message you sent is not valid. Select an option from Preferences Menu.`)
                return { type: "nochange" }
        }

    }

    executeResumePromoMessages = async ({ context }: { context: ISMContext }): Promise<void> => {
        // send update event to crm
        this.clientsService.emitMgntQueue(
            ResumeWhatsAppPromoEventPattern,
            {
                accountId: context.businessInfo.accountId,
                wabaId: context.wabaId,
                whatsAppNumber: context.contact.wa_id
            } as ResumeWhatsAppPromoEventPayload
        )
        // notify user
        sendTextMessage(context, this.clientsService, `Your preference to receive promotional content has been updated. Thank you for your support.`)
    }

    executeResumeUpdateMessages = async ({ context }: { context: ISMContext }): Promise<void> => {
        // sent update event to crm
        this.clientsService.emitMgntQueue(
            ResumeWhatsAppUpdatesEventPattern,
            {
                accountId: context.businessInfo.accountId,
                wabaId: context.wabaId,
                whatsAppNumber: context.contact.wa_id
            } as ResumeWhatsAppPromoEventPayload
        )
        // notify user
        sendTextMessage(context, this.clientsService, `Your preference to receive service updates has been updated. Thank you for your support.`)
    }

    makeMenuInteractiveList(
        context: ISMContext,
    ): InteractiveList {
        return {
            type: "list",
            header: {
                type: "text",
                text: "Preferences"
            },
            body: {
                text: "Change your messaging preferences."
            },
            footer: {
                text: cropTextToLength(`${context.businessInfo.name}: ${context.businessInfo.tagline}`, CHAR_LIMITS.MESSAGE_FOOTER_TEXT)
            },
            action: {
                sections: [{
                    title: "Change Preferences",
                    rows: [{
                        id: resumePromoId,
                        title: "Send Me Promotions",
                        description: "Resume receiving promotional messages."
                    }, {
                        id: resumeUpdatesId,
                        title: "Send Me Updates",
                        description: "Be notified with updates about your services."
                    }, {
                        id: exitPrefsId,
                        title: "Back To Home",
                        description: "Go back to chat."
                    }]
                }],
                button: "Preference Options"
            }
        }
    }
}

const resumePromoId = "resume-whatsapp-promotions";
const resumeUpdatesId = "resume-whatsapp-updates";
const exitPrefsId = "exit-preferences";