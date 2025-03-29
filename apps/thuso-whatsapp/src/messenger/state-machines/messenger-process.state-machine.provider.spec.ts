import { Test, TestingModule } from "@nestjs/testing";
import { MessengerProcessStateMachineProvider } from "./messenger-process.state-machine.provider";
import { LoggingService, mockedLoggingService } from "@lib/logging";
import { MetricsService } from "../services/metrics.service";
import { GraphAPIService, MessengerRMQMessage, TextMessageBody } from "@lib/thuso-common";
import { WhatsAppBusinessService } from "../services/whatsapp-business.service";
import { AnyActorRef, waitFor } from "xstate";

describe('MessengerProcessStateMachineProvider', () => {
    let mpsmProvider: MessengerProcessStateMachineProvider;

    const mockMetricsService = {
        findValidConversation: null,
        createConversation: null,
        createSentMessage: null
    }

    const mockGraphApi = {
        messages: null
    }

    const mockWhatsAppBusinessService = {
        getBusinessInfo: null
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessengerProcessStateMachineProvider,
                {
                    provide: LoggingService,
                    useValue: mockedLoggingService
                },
                {
                    provide: MetricsService,
                    useValue: mockMetricsService
                },
                {
                    provide: GraphAPIService,
                    useValue: mockGraphApi
                },
                {
                    provide: WhatsAppBusinessService,
                    useValue: mockWhatsAppBusinessService
                }
            ],
        }).compile();

        mpsmProvider = module.get<MessengerProcessStateMachineProvider>(MessengerProcessStateMachineProvider);
    });

    afterEach(() => {
    })

    it('should be defined', () => {
        expect(mpsmProvider).toBeDefined();
    });

    it('should run machine actor and send message', async () => {

        const payload: MessengerRMQMessage = {
            wabaId: "some-waba-id",
            metadata: {
                phone_number_id: "SOME-NUMBER-ID",
                display_phone_number: "DISPLAY-NUMBER"
            },
            contact: {
                profile: {
                    name: "profile-name"
                },
                wa_id: "26777897766"
            },
            type: "text",
            text: "the message to be sent",
            conversationType: "service"
        }

        // implement mocks
        mockWhatsAppBusinessService.getBusinessInfo = jest.fn().mockResolvedValue({
            wabaId: payload.wabaId,
            account: {
                id: "some-account-id",
                maxAllowedDailyConversations: 10,
                disabled: false,
                subscriptionEndDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
                updatedAt: new Date()
            },
            wabaToken: "some-waba-token",
            updatedAt: new Date()
        })

        mockMetricsService.findValidConversation = jest.fn().mockResolvedValue({
            id: "conversation-id",
            phoneNumberId: payload.metadata.phone_number_id,
            userId: payload.contact.wa_id,
            type: "service",
            expiry: new Date(Date.now() - 6 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        })

        mockGraphApi.messages = jest.fn().mockResolvedValue({
            messaging_product: "whatsapp",
            contacts: [
                payload.contact
            ],
            messages: [
                {
                    id: "<WHATSAPP_MESSAGE_ID>",
                    message_status: "<PACING_STATUS>"
                }
            ]
        })

        mockMetricsService.createSentMessage = jest.fn().mockResolvedValue(undefined)

        const actor = mpsmProvider.getMachineActor({ payload })

        actor.start()

        await waitFor(
            actor as AnyActorRef,
            (snapshot) => snapshot.hasTag("final")
        )

        const snapshot = actor.getSnapshot()

        expect(snapshot.hasTag("success")).toBe(true)

        expect(mockWhatsAppBusinessService.getBusinessInfo).toHaveBeenCalledTimes(1)
        expect(mockWhatsAppBusinessService.getBusinessInfo).toHaveBeenCalledWith(payload.wabaId)
        expect(mockMetricsService.findValidConversation).toHaveBeenCalledTimes(1)
        expect(mockMetricsService.findValidConversation).toHaveBeenCalledWith(
            payload.metadata.phone_number_id,
            payload.contact.wa_id
        )
        expect(mockGraphApi.messages).toHaveBeenCalledTimes(1)

        const textMsg: TextMessageBody = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            type: "text",
            to: payload.contact.wa_id,
            text: {
                body: payload.text,
                preview_url: true
            }
        }
        expect(mockGraphApi.messages).toHaveBeenCalledWith(
            "some-waba-token",
            payload.metadata.phone_number_id,
            textMsg
        )

    })

    it('should run machine actor and send message-body message', async () => {

        const payload: MessengerRMQMessage = {
            wabaId: "some-waba-id",
            metadata: {
                phone_number_id: "SOME-NUMBER-ID",
                display_phone_number: "DISPLAY-NUMBER"
            },
            contact: {
                profile: {
                    name: "profile-name"
                },
                wa_id: "26777897766"
            },
            type: "message-body",
            messageBody: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: "<WHATSAPP_USER_PHONE_NUMBER>",
                type: "interactive",
                interactive: {
                    type: "list",
                    header: {
                        type: "text",
                        text: "<MESSAGE_HEADER_TEXT"
                    },
                    body: {
                        text: "<MESSAGE_BODY_TEXT>"
                    },
                    footer: {
                        text: "<MESSAGE_FOOTER_TEXT>"
                    },
                    action: {
                        sections: [
                            {
                                "title": "<SECTION_TITLE_TEXT>",
                                "rows": [
                                    {
                                        "id": "<ROW_ID>",
                                        "title": "<ROW_TITLE_TEXT>",
                                        "description": "<ROW_DESCRIPTION_TEXT>"
                                    }
                                ]
                            }
                        ],
                        "button": "<BUTTON_TEXT>",
                    }
                }
            },
            conversationType: "service"
        }

        // implement mocks
        mockWhatsAppBusinessService.getBusinessInfo = jest.fn().mockResolvedValue({
            wabaId: payload.wabaId,
            account: {
                id: "some-account-id",
                maxAllowedDailyConversations: 10,
                disabled: false,
                subscriptionEndDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
                updatedAt: new Date()
            },
            wabaToken: "some-waba-token",
            updatedAt: new Date()
        })

        mockMetricsService.findValidConversation = jest.fn().mockResolvedValue({
            id: "conversation-id",
            phoneNumberId: payload.metadata.phone_number_id,
            userId: payload.contact.wa_id,
            type: "service",
            expiry: new Date(Date.now() - 6 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        })

        mockGraphApi.messages = jest.fn().mockResolvedValue({
            messaging_product: "whatsapp",
            contacts: [
                payload.contact
            ],
            messages: [
                {
                    id: "<WHATSAPP_MESSAGE_ID>",
                    message_status: "<PACING_STATUS>"
                }
            ]
        })

        mockMetricsService.createSentMessage = jest.fn().mockResolvedValue(undefined)

        const actor = mpsmProvider.getMachineActor({ payload })

        actor.start()

        await waitFor(
            actor as AnyActorRef,
            (snapshot) => snapshot.hasTag("final")
        )

        const snapshot = actor.getSnapshot()

        expect(snapshot.hasTag("success")).toBe(true)

        expect(mockWhatsAppBusinessService.getBusinessInfo).toHaveBeenCalledTimes(1)
        expect(mockWhatsAppBusinessService.getBusinessInfo).toHaveBeenCalledWith(payload.wabaId)
        expect(mockMetricsService.findValidConversation).toHaveBeenCalledTimes(1)
        expect(mockMetricsService.findValidConversation).toHaveBeenCalledWith(
            payload.metadata.phone_number_id,
            payload.contact.wa_id
        )
        expect(mockGraphApi.messages).toHaveBeenCalledTimes(1)
        expect(mockGraphApi.messages).toHaveBeenCalledWith(
            "some-waba-token",
            payload.metadata.phone_number_id,
            payload.messageBody
        )

    })
})