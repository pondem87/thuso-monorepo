import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Repository } from "typeorm";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { MessageProcessorController } from "../../src/message-processor/controllers/message-processor.controller";
import { PersistedInteractiveState } from "../../src/message-processor/entities/persisted-interactive-state.entity";
import { ThusoWhatsappModule } from "../../src/thuso-whatsapp.module";
import { Contact, LLMEventPattern, LLMQueueMessage, LlmRmqClient, LONG_TEST_TIMEOUT, Messages, Metadata } from "@lib/thuso-common";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import { MessageProcessorAccountData } from "../../src/message-processor/entities/account-data.entity";
import AppDataSource from '../../src/db/datasource'

describe('MessageProcessor/MessageProcessorController (e2e)', () => {
    let app: INestApplication;
    let testLLMRmqClient: ClientProxy;
    let messageProcessorController: MessageProcessorController;
    let persistedStateRepository: Repository<PersistedInteractiveState>;
    let accountDataRepo: Repository<MessageProcessorAccountData>;
    let configService: ConfigService;
    let emitMessageSpy: jest.SpyInstance;
    let fetchMock: jest.SpyInstance;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRootAsync({
                    useFactory: () => ({
                        ...AppDataSource.options,
                        autoLoadEntities: true,
                        entities: undefined,
                        migrations: undefined
                    })
                }),
                ThusoWhatsappModule]
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get the instance of the service
        testLLMRmqClient = moduleFixture.get<ClientProxy>(LlmRmqClient);
        messageProcessorController = moduleFixture.get<MessageProcessorController>(MessageProcessorController)
        persistedStateRepository = moduleFixture.get<Repository<PersistedInteractiveState>>(getRepositoryToken(PersistedInteractiveState))
        accountDataRepo = moduleFixture.get<Repository<MessageProcessorAccountData>>(getRepositoryToken(MessageProcessorAccountData))
        configService = moduleFixture.get<ConfigService>(ConfigService);

        // Spy on emit
        emitMessageSpy = jest.spyOn(testLLMRmqClient, 'emit');
    }, LONG_TEST_TIMEOUT);

    afterEach(() => {
        emitMessageSpy.mockClear()
    })

    it('process text message, create new account data and send to LLM', async () => {
        await persistedStateRepository.delete({})

        const wabaId = "waba_54321"
        await accountDataRepo.delete({ wabaId })

        const metadata: Metadata = {
            display_phone_number: "display_phone_number",
            phone_number_id: "PHONE_NUMBER_ID"
        };

        const accountId = uuidv4()

        const businessInfoMock = {
            id: uuidv4(),
            accountId,
            wabaId: "waba_54321",
            name: "Thuso AI Services",
            wabaToken: "mock_waba_token",
            subscribed: true,
            disabled: false,
            businessProfile: {
                id: uuidv4(),
                accountId,
                name: "Thuso AI",
                tagline: "AI-powered customer engagement",
                serviceDescription: "Providing AI-driven customer service through WhatsApp.",
                about: "We help businesses automate conversations with AI.",
                imageLogoId: "logo_12345",
                imageBannerId: "banner_67890",
            },
            createdAt: new Date()
        };

        const accountInfoMock = {
            id: accountId,
            name: "Thuso AI Services",
            disabled: false,
            maxAllowedDailyConversations: 10,
            subscriptionEndDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
            createdAt: new Date()
        };

        // mock fetch
        fetchMock = jest.spyOn(global, 'fetch').mockImplementation(
            async (input: RequestInfo) => {
                if (typeof input === 'string') {
                    console.log(`FETCH URL = ${input}`)
                    if (input === `http://${configService.get<string>("MANAGEMENT_SERVER_URL")}:${configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/businesses/phone-number/${metadata.phone_number_id}`) {
                        return {
                            ok: true,
                            json: () => Promise.resolve(businessInfoMock),
                            status: 200
                        } as Response;
                    } else if (input === `http://${configService.get<string>("MANAGEMENT_SERVER_URL")}:${configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/accounts/${businessInfoMock.accountId}`) {
                        return {
                            ok: true,
                            json: () => Promise.resolve(accountInfoMock),
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

        await messageProcessorController.processMessage({
            wabaId,
            metadata,
            contact,
            message
        })

        expect(emitMessageSpy).toHaveBeenCalledTimes(1)

        const testPayload: LLMQueueMessage = {
            wabaId,
            metadata,
            contact,
            prompt: message.text.body
        }

        expect(emitMessageSpy).toHaveBeenCalledWith(LLMEventPattern, testPayload)

        const persState = await persistedStateRepository.findOneBy({ userId: contact.wa_id })
        const accountData = await accountDataRepo.findOneBy({ wabaId })

        expect(persState.userId).toBe(contact.wa_id)
        expect(persState.phoneNumberId).toEqual(metadata.phone_number_id)
        expect(accountData.wabaId).toBe(wabaId)
        expect(accountData.phoneNumberId).toEqual(metadata.phone_number_id)

        await persistedStateRepository.delete({ userId: contact.wa_id })
        await accountDataRepo.delete({ wabaId })

    }, LONG_TEST_TIMEOUT);

    it('process text message, use stored account data and send to LLM', async () => {
        await persistedStateRepository.delete({})

        const wabaId = "waba_54321"
        await accountDataRepo.delete({ wabaId })

        const metadata: Metadata = {
            display_phone_number: "display_phone_number",
            phone_number_id: "PHONE_NUMBER_ID"
        };

        const accountId = uuidv4()

        await accountDataRepo.save(
            accountDataRepo.create({
                phoneNumberId: metadata.phone_number_id,
                accountId,
                wabaId,
                wabaToken: "mock_waba_token",
                businessName: "Thuso AI",
                tagline: "AI-powered customer engagement",
                serviceDescription: "Providing AI-driven customer service through WhatsApp.",
                about: "We help businesses automate conversations with AI.",
                subscriptionEndDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
                disabled: false,
                updatedAt: new Date(),
            })
        )

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

        await messageProcessorController.processMessage({
            wabaId,
            metadata,
            contact,
            message
        })

        expect(emitMessageSpy).toHaveBeenCalledTimes(1)

        const testPayload: LLMQueueMessage = {
            wabaId,
            metadata,
            contact,
            prompt: message.text.body
        }

        expect(emitMessageSpy).toHaveBeenCalledWith(LLMEventPattern, testPayload)

        const persState = await persistedStateRepository.findOneBy({ userId: contact.wa_id })
        const accountData = await accountDataRepo.findOneBy({ wabaId })

        expect(persState.userId).toBe(contact.wa_id)
        expect(persState.phoneNumberId).toEqual(metadata.phone_number_id)
        expect(accountData.wabaId).toBe(wabaId)
        expect(accountData.phoneNumberId).toEqual(metadata.phone_number_id)

        await persistedStateRepository.delete({ userId: contact.wa_id })
        await accountDataRepo.delete({ wabaId })

    }, LONG_TEST_TIMEOUT);

    it('refresh account data and detect expired subscription', async () => {
        await persistedStateRepository.delete({})

        const wabaId = "waba_54321"
        await accountDataRepo.delete({ wabaId })

        const metadata: Metadata = {
            display_phone_number: "display_phone_number",
            phone_number_id: "PHONE_NUMBER_ID"
        };

        const accountId = uuidv4()

        const businessInfoMock = {
            id: uuidv4(),
            accountId,
            wabaId: "waba_54321",
            name: "Thuso AI Services",
            wabaToken: "mock_waba_token",
            subscribed: true,
            disabled: false,
            businessProfile: {
                id: uuidv4(),
                accountId,
                name: "Thuso AI",
                tagline: "AI-powered customer engagement",
                serviceDescription: "Providing AI-driven customer service through WhatsApp.",
                about: "We help businesses automate conversations with AI.",
                imageLogoId: "logo_12345",
                imageBannerId: "banner_67890",
            },
            createdAt: new Date()
        };

        const accountInfoMock = {
            id: accountId,
            name: "Thuso AI Services",
            disabled: false,
            subscriptionEndDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
            createdAt: new Date()
        };

        // create account data
        await accountDataRepo.save(
            accountDataRepo.create({
                phoneNumberId: metadata.phone_number_id,
                accountId,
                wabaId,
                wabaToken: businessInfoMock.wabaToken,
                businessName: businessInfoMock.businessProfile.name,
                tagline: businessInfoMock.businessProfile.tagline,
                serviceDescription: businessInfoMock.businessProfile.serviceDescription,
                about: businessInfoMock.businessProfile.about,
                subscriptionEndDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
                disabled: false,
                updatedAt: new Date(Date.now() - ((parseInt(configService.get<string>("MESSAGE_PROCESSOR_ACCOUNT_DATA_DURATION_HOURS")) || 6) + 3)  * 60 * 60 * 1000),
            })
        )

        // mock fetch
        fetchMock = jest.spyOn(global, 'fetch').mockImplementation(
            async (input: RequestInfo) => {
                if (typeof input === 'string') {
                    console.log(`FETCH URL = ${input}`)
                    if (input === `http://${configService.get<string>("MANAGEMENT_SERVER_URL")}:${configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/businesses/phone-number/${metadata.phone_number_id}`) {
                        return {
                            ok: true,
                            json: () => Promise.resolve(businessInfoMock),
                            status: 200
                        } as Response;
                    } else if (input === `http://${configService.get<string>("MANAGEMENT_SERVER_URL")}:${configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/accounts/${businessInfoMock.accountId}`) {
                        return {
                            ok: true,
                            json: () => Promise.resolve(accountInfoMock),
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

        await messageProcessorController.processMessage({
            wabaId,
            metadata,
            contact,
            message
        })

        expect(emitMessageSpy).toHaveBeenCalledTimes(0)

        const accountData = await accountDataRepo.findOneBy({ wabaId })

        expect(accountData.wabaId).toBe(wabaId)
        expect(accountData.phoneNumberId).toEqual(metadata.phone_number_id)

        await persistedStateRepository.delete({ userId: contact.wa_id })
        await accountDataRepo.delete({ wabaId })

    }, LONG_TEST_TIMEOUT);

});