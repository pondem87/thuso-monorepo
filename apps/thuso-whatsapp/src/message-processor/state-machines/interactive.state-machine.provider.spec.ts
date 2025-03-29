import { Test, TestingModule } from '@nestjs/testing';
import { BusinessInfo, defaultTake, InteractiveStateMachineProvider, ISMContext, ISMEventType } from './interactive.state-machine.provider';
import { InteractiveStateMachineService } from './interactive.state-machine.service';
import { AnyActorRef, createActor, waitFor } from 'xstate';
import { Contact, GraphAPIService, Messages, MessengerEventPattern, MessengerRMQMessage, Metadata, StateMachineActor, WhatsappRmqClient } from '@lib/thuso-common';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { HomeStateService } from '../machine-states/home-state.service';
import { Product, ProductsStateService } from '../machine-states/products-state.service';
import { LLMQueueService } from '../services/llm-queue.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from "uuid";

describe('MessageProcessorService', () => {
    let provider: InteractiveStateMachineProvider;
    let fetchMock: jest.SpyInstance
    
    const llmQueueService = {
        sendPlainTextToLLM: jest.fn()
    }

    const whatsappRmqClient = {
        emit: jest.fn()
    }

    const graphAPIService = {
        uploadMedia: jest.fn().mockResolvedValue("mediaId")
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InteractiveStateMachineProvider,
                {
                    provide: InteractiveStateMachineService,
                    useValue: {
                        getPersistedInteractiveState: jest.fn().mockResolvedValue(null)
                    },
                },
                {
                    provide: LoggingService,
                    useValue: mockedLoggingService,
                },
                HomeStateService,
                ProductsStateService,
                {
                    provide: LLMQueueService,
                    useValue: llmQueueService
                },
                {
                    provide: WhatsappRmqClient,
                    useValue: whatsappRmqClient
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((input) => input)
                    }
                },
                {
                    provide: GraphAPIService,
                    useValue: graphAPIService
                }
            ],
        }).compile();

        provider = module.get<InteractiveStateMachineProvider>(InteractiveStateMachineProvider);
    });

    afterEach(() => {
        llmQueueService.sendPlainTextToLLM.mockClear()
        whatsappRmqClient.emit.mockClear()
    })

    it('state machine should start', () => {

        const wabaId = "waba_54321"

        const metadata: Metadata = {
            display_phone_number: "display_phone_number",
            phone_number_id: "PHONE_NUMBER_ID"
        };

        const contact: Contact = {
            "profile": {
                "name": "NAME"
            },
            "wa_id": "WHATSAPP_ID"
        }

        const ismActor: StateMachineActor<ISMEventType, ISMContext> = createActor(provider.getInteractiveStateMachine(), {
            input: {
                wabaId,
                contact,
                metadata
            }
        })

        ismActor.start()

        expect(ismActor.getSnapshot().value).toEqual({home: "ready"})
        expect(ismActor.getSnapshot().context).toMatchObject({
            wabaId,
            contact,
            metadata
        })
    });

    it('state machine should execute', async () => {

        const wabaId = "waba_54321"

        const metadata: Metadata = {
            display_phone_number: "display_phone_number",
            phone_number_id: "PHONE_NUMBER_ID"
        };

        const contact: Contact = {
            "profile": {
                "name": "NAME"
            },
            "wa_id": "WHATSAPP_ID"
        }

        const message: Messages = {
            "from": "<WHATSAPP_USER_PHONE_NUMBER>",
            "id": "<WHATSAPP_MESSAGE_ID>",
            "timestamp": "<WEBHOOK_SENT_TIMESTAMP>",
            "text": {
                "body": "<MESSAGE_BODY_TEXT>"
            },
            "type": "text"
        }

        const businessInfo: BusinessInfo = {
            name: "business_name",
            tagline: "thunderbolt kick",
            wabaToken: "some-waba-token"
        }

        const ismActor: StateMachineActor<ISMEventType, ISMContext> = createActor(provider.getInteractiveStateMachine(), {
            input: {
                wabaId,
                contact,
                metadata
            }
        })

        ismActor.start()

        expect(ismActor.getSnapshot().value).toEqual({home: "ready"})
        expect(ismActor.getSnapshot().context).toMatchObject({
            wabaId,
            contact,
            metadata
        })

        ismActor.send({
            type: "execute",
            payload: {
                message,
                contact,
                businessInfo
            }
        })

        await waitFor(
            ismActor as AnyActorRef,
            (snapshot) => snapshot.hasTag("executed") || snapshot.hasTag("ready")
        )

        expect(ismActor.getSnapshot().hasTag("executed")).toBe(true)
        expect(llmQueueService.sendPlainTextToLLM).toHaveBeenCalledTimes(1)
    });

    it('state machine state should change to products', async () => {

        const wabaId = "waba_54321"

        const metadata: Metadata = {
            display_phone_number: "display_phone_number",
            phone_number_id: "PHONE_NUMBER_ID"
        };

        const contact: Contact = {
            "profile": {
                "name": "NAME"
            },
            "wa_id": "WHATSAPP_ID"
        }

        const message: Messages = {
            "from": "<WHATSAPP_USER_PHONE_NUMBER>",
            "id": "<WHATSAPP_MESSAGE_ID>",
            "timestamp": "<WEBHOOK_SENT_TIMESTAMP>",
            "text": {
                "body": "<MESSAGE_BODY_TEXT>"
            },
            "type": "text"
        }

        const businessInfo: BusinessInfo = {
            name: "business_name",
            tagline: "thunderbolt kick",
            wabaToken: "some-waba-token"
        }

        const businessProfile = {
            id: uuidv4(),
            accountId: uuidv4(),
            name: "Thuso AI",
            tagline: "AI-powered customer engagement",
            serviceDescription: "Providing AI-driven customer service through WhatsApp.",
            about: "We help businesses automate conversations with AI.",
            imageLogoId: "logo_12345",
            imageBannerId: "banner_67890",
        }

        const products: Product[] = [
            {
                accountId: businessProfile.accountId,
                businessProfileId: businessProfile.id,
                name: "Thuso",
                shortDescription: "Your AI chatbot",
                fullDetails: "A lot of text here",
                mimetype: "",
                s3key: "",
                price: "",
                createdAt: new Date(),
                updatedAt: new Date(),
                id: uuidv4()
            }
        ]

        fetchMock = jest.spyOn(global, 'fetch').mockImplementation(
            async (input: RequestInfo) => {
                if (typeof input === 'string') {
                    console.log(`FETCH URL = ${input}`)
                    if (input === `http://MANAGEMENT_SERVER_URL:MANAGEMENT_SERVER_PORT/api/${wabaId}/businesses/profile`) {
                        return {
                            ok: true,
                            json: () => Promise.resolve(businessProfile),
                            status: 200
                        } as Response;
                    } else if (input === `http://MANAGEMENT_SERVER_URL:MANAGEMENT_SERVER_PORT/api/${businessProfile.id}/products?skip=0&take=${defaultTake}`) {
                        return {
                            ok: true,
                            json: () => Promise.resolve([products, 1]),
                            status: 200
                        } as Response;
                    } else {
                        return {
                            ok: false,
                            json: () => Promise.resolve({ error: 'Not found' }),
                            status: 404
                        } as Response;
                    }
                }
                return Promise.reject(new Error('Invalid request'));
            });

        const ismActor: StateMachineActor<ISMEventType, ISMContext> = createActor(provider.getInteractiveStateMachine(), {
            input: {
                wabaId,
                contact,
                metadata,
                businessInfo
            }
        })

        ismActor.start()

        expect(ismActor.getSnapshot().value).toEqual({home: "ready"})
        expect(ismActor.getSnapshot().context).toMatchObject({
            wabaId,
            contact,
            metadata
        })

        ismActor.send({
            type: "products"
        })

        expect(ismActor.getSnapshot().value).toEqual({products: { productsMenu: "ready" }})

        await new Promise((resolve) => setImmediate(resolve));

        expect(whatsappRmqClient.emit).toHaveBeenCalledTimes(1)

        const messengerPayload: MessengerRMQMessage = {
            wabaId,
            contact,
            metadata,
            type: "message-body",
            messageBody: expect.objectContaining({
                type: "interactive",
                to: contact.wa_id
            }),
            conversationType: "service"
        }

        expect(whatsappRmqClient.emit).toHaveBeenCalledWith(
            MessengerEventPattern,
            messengerPayload
        )
    });

    it('state machine state should change to products and execute', async () => {

        const wabaId = "waba_54321"

        const metadata: Metadata = {
            display_phone_number: "display_phone_number",
            phone_number_id: "PHONE_NUMBER_ID"
        };

        const contact: Contact = {
            "profile": {
                "name": "NAME"
            },
            "wa_id": "WHATSAPP_ID"
        }

        const message: Messages = {
            "from": "<WHATSAPP_USER_PHONE_NUMBER>",
            "id": "<WHATSAPP_MESSAGE_ID>",
            "timestamp": "<WEBHOOK_SENT_TIMESTAMP>",
            "text": {
                "body": "<MESSAGE_BODY_TEXT>"
            },
            "type": "text"
        }

        const businessInfo: BusinessInfo = {
            name: "business_name",
            tagline: "thunderbolt kick",
            wabaToken: "some-business-token"
        }

        const businessProfile = {
            id: uuidv4(),
            accountId: uuidv4(),
            name: "Thuso AI",
            tagline: "AI-powered customer engagement",
            serviceDescription: "Providing AI-driven customer service through WhatsApp.",
            about: "We help businesses automate conversations with AI.",
            imageLogoId: "logo_12345",
            imageBannerId: "banner_67890",
        }

        const products: Product[] = [
            {
                accountId: businessProfile.accountId,
                businessProfileId: businessProfile.id,
                name: "Thuso",
                shortDescription: "Your AI chatbot",
                fullDetails: "A lot of text here",
                mimetype: "image/jpeg",
                s3key: "some-s3-key",
                price: "",
                createdAt: new Date(),
                updatedAt: new Date(),
                id: uuidv4()
            }
        ]

        fetchMock = jest.spyOn(global, 'fetch').mockImplementation(
            async (input: RequestInfo) => {
                if (typeof input === 'string') {
                    console.log(`FETCH URL = ${input}`)
                    if (input === `http://MANAGEMENT_SERVER_URL:MANAGEMENT_SERVER_PORT/api/${wabaId}/businesses/profile`) {
                        return {
                            ok: true,
                            json: () => Promise.resolve(businessProfile),
                            status: 200
                        } as Response;
                    } else if (input === `http://MANAGEMENT_SERVER_URL:MANAGEMENT_SERVER_PORT/api/${businessProfile.id}/products?skip=0&take=${defaultTake}`) {
                        return {
                            ok: true,
                            json: () => Promise.resolve([products, 1]),
                            status: 200
                        } as Response;
                    } else if (input === `http://MANAGEMENT_SERVER_URL:MANAGEMENT_SERVER_PORT/api/${businessProfile.id}/products/${products[0].id}`) {
                        return {
                            ok: true,
                            json: () => Promise.resolve(products[0]),
                            status: 200
                        } as Response;
                    } else {
                        return {
                            ok: false,
                            json: () => Promise.resolve({ error: 'Not found' }),
                            status: 404
                        } as Response;
                    }
                }
                return Promise.reject(new Error('Invalid request'));
            });

        const ismActor: StateMachineActor<ISMEventType, ISMContext> = createActor(provider.getInteractiveStateMachine(), {
            input: {
                wabaId,
                contact,
                metadata,
                businessInfo
            }
        })

        ismActor.start()

        expect(ismActor.getSnapshot().value).toEqual({home: "ready"})
        expect(ismActor.getSnapshot().context).toMatchObject({
            wabaId,
            contact,
            metadata
        })

        ismActor.send({
            type: "products"
        })

        expect(ismActor.getSnapshot().value).toEqual({products: { productsMenu: "ready" }})

        await new Promise((resolve) => setImmediate(resolve));

        expect(whatsappRmqClient.emit).toHaveBeenCalledTimes(1)

        const messengerPayload: MessengerRMQMessage = {
            wabaId,
            contact,
            metadata,
            type: "message-body",
            messageBody: expect.objectContaining({
                type: "interactive",
                to: contact.wa_id
            }),
            conversationType: "service"
        }

        expect(whatsappRmqClient.emit).toHaveBeenCalledWith(
            MessengerEventPattern,
            messengerPayload
        )

        const message2: Messages = {
            from: "<WHATSAPP_USER_PHONE_NUMBER>",
            id: "<WHATSAPP_MESSAGE_ID>",
            timestamp: "<WEBHOOK_SENT_TIMESTAMP>",
            type: "interactive",
            interactive: {
                type: "list_reply",
                list_reply: {
                    id: products[0].id,
                    title: products[0].name,
                    description: products[0].shortDescription
                }
            }
        }

        ismActor.send({
            type: "execute",
            payload: {
                message: message2,
                contact,
                businessInfo
            }
        })

        await waitFor(
            ismActor as AnyActorRef,
            (snapshot) => snapshot.hasTag("executed") || snapshot.hasTag("ready")
        )

        expect(ismActor.getSnapshot().value).toEqual({products: { productsMenu: "executed" }})

        await new Promise((resolve) => setImmediate(resolve));

        expect(graphAPIService.uploadMedia).toHaveBeenCalledWith(
            businessInfo.wabaToken,
            metadata.phone_number_id,
            products[0].mimetype,
            `http://MANAGEMENT_SERVER_URL:MANAGEMENT_SERVER_PORT/management/documents/download/${products[0].s3key}`
        )

        expect(whatsappRmqClient.emit).toHaveBeenCalledTimes(2)

        const messengerPayload2: MessengerRMQMessage = {
            wabaId,
            contact,
            metadata,
            type: "message-body",
            messageBody: expect.objectContaining({
                type: "interactive",
                to: contact.wa_id,
                interactive: expect.objectContaining({
                    type: "button"
                })
            }),
            conversationType: "service"
        }

        expect(whatsappRmqClient.emit).toHaveBeenCalledWith(
            MessengerEventPattern,
            messengerPayload2
        )
    });
});
