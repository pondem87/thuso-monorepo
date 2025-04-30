import { LoggingService } from "@lib/logging";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { assign, createActor, fromPromise, setup } from "xstate";
import { GraphAPIService, ImageMessageBody, InteractiveListMessageBody, MainMenuItems, MessageBody, MessengerRMQMessage, StateMachineActor, TextMessageBody } from "@lib/thuso-common";
import { Conversation } from "../entities/conversation.entity";
import { MessengerWhatsAppBusiness } from "../entities/whatsapp-business.entity";
import { MetricsService } from "../services/metrics.service";
import { WhatsAppBusinessService } from "../services/whatsapp-business.service";
import { compileMenu } from "./functions";

@Injectable()
export class MessengerProcessStateMachineProvider {
    private logger: Logger
    private MessengerProcessStateMachine = setup({
        types: {
            events: {} as MPSMEventType,
            context: {} as MPSMContext,
            input: {} as MPSMInput,
            children: {} as {
                getBusinessInfo: "getBusinessInfo";
                prepareMessage: "prepareMessage";
                checkConversation: "checkConversation";
                sendMessage: "sendMessage";
            }
        },
        actors: {
            getBusinessInfo: fromPromise(async ({ input }: { input: { context: MPSMContext } }) => {
                return await this.getBusinessInfo(input)
            }),
            prepareMessage: fromPromise(async ({ input }: { input: { context: MPSMContext } }) => {
                return await this.prepareMessage(input)
            }),
            checkConversation: fromPromise(async ({ input }: { input: { context: MPSMContext } }) => {
                return await this.checkConversation(input)
            }),
            sendMessage: fromPromise(async ({ input }: { input: { context: MPSMContext } }) => {
                return await this.sendMessage(input)
            })
        }
    })
        .createMachine({
            id: "messenger-process",
            context: ({ input }) => ({
                payload: input.payload
            }),
            initial: "gettingBusinessInfo",
            states: {
                gettingBusinessInfo: {
                    invoke: {
                        id: "getBusinessInfo",
                        src: "getBusinessInfo",
                        input: ({ context }) => ({ context }),
                        onDone: {
                            target: "PreparingMessage",
                            actions: assign({
                                whatsAppBusiness: ({ event }) => event.output
                            })
                        },
                        onError: {
                            target: "Failure",
                            actions: assign({
                                error: ({ event }) => event.error
                            })
                        }
                    }
                },
                PreparingMessage: {
                    invoke: {
                        id: "prepareMessage",
                        src: "prepareMessage",
                        input: ({ context }) => ({ context }),
                        onDone: {
                            target: "CheckingConversation",
                            actions: assign({
                                messageBody: ({ event }) => event.output
                            })
                        },
                        onError: {
                            target: "Failure",
                            actions: assign({
                                error: ({ event }) => event.error
                            })
                        }
                    }
                },
                CheckingConversation: {
                    invoke: {
                        id: "checkConversation",
                        src: "checkConversation",
                        input: ({ context }) => ({ context }),
                        onDone: {
                            target: "SendingMessage",
                            actions: assign({
                                conversation: ({ event }) => event.output
                            })
                        },
                        onError: {
                            target: "Failure",
                            actions: assign({
                                error: ({ event }) => event.error
                            })
                        }
                    }
                },
                SendingMessage: {
                    invoke: {
                        id: "sendMessage",
                        src: "sendMessage",
                        input: ({ context }) => ({ context }),
                        onDone: {
                            target: "Complete",
                        },
                        onError: {
                            target: "Failure",
                            actions: assign({
                                error: ({ event }) => event.error
                            })
                        }
                    }
                },
                Complete: {
                    tags: ["final", "success"]
                },
                Failure: {
                    tags: ["final", "failure"]
                }
            }
        })

    constructor(
        private readonly loggingService: LoggingService,
        private readonly metricsService: MetricsService,
        private readonly whatsAppBusinessService: WhatsAppBusinessService,
        private readonly graphApiService: GraphAPIService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "whatsapp-messenger",
            file: "messenger-process.state-machine.provider"
        })
    }

    getMachineActor(input: MPSMInput): StateMachineActor<MPSMEventType, MPSMContext> {
        return createActor(this.MessengerProcessStateMachine, { input }) as StateMachineActor<MPSMEventType, MPSMContext>
    }

    async getBusinessInfo(input: { context: MPSMContext; }): Promise<MessengerWhatsAppBusiness> {
        return await this.whatsAppBusinessService.getBusinessInfo(input.context.payload.wabaId)
    }

    async prepareMessage(input: { context: MPSMContext; }): Promise<MessageBody[]> {

        const context = input.context

        switch (context.payload.type) {
            case "text":

                const textMsgBody: TextMessageBody[] = []

                const maxMsgChars = 4096

                const numberOfChunks = Math.ceil(context.payload.text?.length / maxMsgChars)

                for (let i = 0; i < numberOfChunks; i++) {
                    const start = i * maxMsgChars;
                    const end = start + maxMsgChars;
                    textMsgBody.push({
                        messaging_product: "whatsapp",
                        recipient_type: "individual",
                        to: context.payload.contact.wa_id,
                        type: "text",
                        text: {
                            body: context.payload.text?.slice(start, end),
                            preview_url: true
                        }
                    })
                }

                return textMsgBody

            case "image":

                const imageLink = context.payload.mediaLink
                const mimetype = context.payload.mimetype
                const caption = context.payload.caption

                const imgMsgBody: ImageMessageBody[] = []

                imgMsgBody.push({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: context.payload.contact.wa_id,
                    type: "image",
                    image: {
                        id: await this.graphApiService.uploadMedia(
                            context.whatsAppBusiness.wabaToken,
                            context.payload.metadata.phone_number_id,
                            mimetype,
                            imageLink
                        ),
                        caption
                    }
                })

                return imgMsgBody

            case "message-body":
                const anyMessageBody: MessageBody[] = []
                anyMessageBody.push(context.payload.messageBody)

                return anyMessageBody

            case "menu":
                const listMsgBody: InteractiveListMessageBody[] = []

                switch (context.payload.menuId) {
                    case "main-menu":
                        listMsgBody.push({
                            messaging_product: "whatsapp",
                            recipient_type: "individual",
                            to: context.payload.contact.wa_id,
                            type: "interactive",
                            interactive: compileMenu(
                                "Main Menu",
                                "View services, products, promotions and more...",
                                MainMenuItems,
                                `${context.whatsAppBusiness.profileName}: ${context.whatsAppBusiness.tagLine}`
                            )
                        })
                        
                        return listMsgBody
                    default:
                }

            default:
                this.logger.error("Failed to prepare message: Unhandled case", context)
                return []
        }
    }

    async checkConversation(input: { context: MPSMContext; }): Promise<Conversation> {

        const context = input.context

        let conversation = await this.metricsService.findValidConversation(
            context.payload.metadata.phone_number_id,
            context.payload.contact.wa_id,
            "service"
        )
        if (conversation != null) return conversation

        // create a new conversation if service message
        if (input.context.payload.conversationType === "service") {
            conversation = await this.metricsService.createConversation(
                context.payload.wabaId,
                context.payload.metadata.phone_number_id,
                context.payload.contact.wa_id,
                "service"
            )
        } else if (input.context.payload.conversationType === "marketing") {
            conversation = await this.metricsService.createConversation(
                context.payload.wabaId,
                context.payload.metadata.phone_number_id,
                context.payload.contact.wa_id,
                "marketing"
            )
        }

        return conversation
    }

    async sendMessage(input: { context: MPSMContext; }): Promise<boolean> {

        const context = input.context

        if (!context.conversation) {
            throw new Error("Could not get conversation.")
        }

        for (const body of input.context.messageBody) {
            const response = await this.graphApiService.messages(
                context.whatsAppBusiness.wabaToken,
                context.payload.metadata.phone_number_id,
                body
            )

            if (response !== null) {
                await this.metricsService.createSentMessage(
                    response.messages[0].id,
                    body,
                    input.context.conversation
                )
            } else {
                return false
            }
        }

        return true

    }
}

export type MPSMEventType = { type: string }

export type MPSMContext = {
    payload: MessengerRMQMessage,
    messageBody?: MessageBody[],
    conversation?: Conversation,
    whatsAppBusiness?: MessengerWhatsAppBusiness,
    error?: any
}

export type MPSMInput = {
    payload: MessengerRMQMessage
}