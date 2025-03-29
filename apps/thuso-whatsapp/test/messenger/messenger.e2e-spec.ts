import { INestApplication } from "@nestjs/common";
import { ThusoWhatsappModule } from "../../src/thuso-whatsapp.module";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { LONG_TEST_TIMEOUT, MessengerRMQMessage, Metadata } from "@lib/thuso-common";
import { MessengerController } from "../../src/messenger/controllers/messenger.controller";
import { MessengerAccount } from "../../src/messenger/entities/account.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { v4 as uuidv4 } from "uuid"
import { Conversation } from "../../src/messenger/entities/conversation.entity";
import { DailyMetrics } from "../../src/messenger/entities/daily-metrics.entity";
import { RunningMetrics } from "../../src/messenger/entities/running-metrics";
import { SentMessage } from "../../src/messenger/entities/sent-message.entity";
import { MessengerWhatsAppBusiness } from "../../src/messenger/entities/whatsapp-business.entity";

describe('Messenger/MessengerController (e2e)', () => {
    let app: INestApplication;
    let messengerController: MessengerController;
    let messengerAccountRepository: Repository<MessengerAccount>;
    let conversationRepo: Repository<Conversation>;
    let dailyMetricsRepo: Repository<DailyMetrics>;
    let runningMetricsRepo: Repository<RunningMetrics>;
    let sentMessageRepo: Repository<SentMessage>;
    let whatsAppBusinessRepo: Repository<MessengerWhatsAppBusiness>;
    let configService: ConfigService;
    let fetchMock: jest.SpyInstance;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ThusoWhatsappModule]
        })
        .compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get the instance of the service
        messengerController = moduleFixture.get<MessengerController>(MessengerController)
        messengerAccountRepository = moduleFixture.get<Repository<MessengerAccount>>(getRepositoryToken(MessengerAccount))
        conversationRepo = moduleFixture.get<Repository<Conversation>>(getRepositoryToken(Conversation))
        dailyMetricsRepo = moduleFixture.get<Repository<DailyMetrics>>(getRepositoryToken(DailyMetrics))
        runningMetricsRepo = moduleFixture.get<Repository<RunningMetrics>>(getRepositoryToken(RunningMetrics))
        sentMessageRepo = moduleFixture.get<Repository<SentMessage>>(getRepositoryToken(SentMessage))
        whatsAppBusinessRepo = moduleFixture.get<Repository<MessengerWhatsAppBusiness>>(getRepositoryToken(MessengerWhatsAppBusiness))
        configService = moduleFixture.get<ConfigService>(ConfigService);


        // delete stuff
        await whatsAppBusinessRepo.delete({})
        await messengerAccountRepository.delete({})
        await sentMessageRepo.delete({})
        await conversationRepo.delete({})
        await dailyMetricsRepo.delete({}),
        await runningMetricsRepo.delete({}) 
    }, LONG_TEST_TIMEOUT);

    it('should be defined', () => {
        expect(messengerController).toBeDefined()
    })

    it('should send text message', async() => {

        const wabaId = "waba_54321"
        const queueMsg: MessengerRMQMessage = {
            wabaId,
            metadata: {
                phone_number_id: "PHONE_NUMBER_ID",
                display_phone_number: "777666555"
            },
            type: "text",
            text: "so this is a text message",
            conversationType: "service",
            contact: {
                profile: {
                    name: "user's name"
                },
                wa_id: "USER_ID"
            }
        }

        const metadata: Metadata = queueMsg.metadata

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
                    if (input === `http://${configService.get<string>("MANAGEMENT_SERVER_URL")}:${configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/businesses/${wabaId}`) {
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
                    } else if (input === `${configService.get<string>("FACEBOOK_GRAPH_API")}/${metadata.phone_number_id}/messages`) {
                        return {
                            ok: true,
                            json: () => Promise.resolve({
                                messaging_product: "whatsapp",
                                contacts: [
                                  queueMsg.contact
                                ],
                                messages: [
                                  {
                                    id: "<WHATSAPP_MESSAGE_ID>",
                                    message_status: "<PACING_STATUS>"
                                  }
                                ]
                              }),
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

        await messengerController.processMassage(queueMsg)

        const business = await whatsAppBusinessRepo.findOneBy({wabaId})
        const account = await messengerAccountRepository.findOne({where: {id: accountId}, relations: {wabas: true}})
        const conversation = await conversationRepo.findOneBy({phoneNumberId: metadata.phone_number_id, userId: queueMsg.contact.wa_id})
        const message = await sentMessageRepo.findOneBy({wamid: "<WHATSAPP_MESSAGE_ID>"})
        const runningMetrics = await runningMetricsRepo.findOneBy({wabaId})

        expect(business).toBeTruthy()
        expect(business.wabaId).toBe(wabaId)
        expect(account).toBeTruthy()
        expect(account.maxAllowedDailyConversations).toBe(accountInfoMock.maxAllowedDailyConversations)
        expect(account.wabas[0].wabaId).toBe(wabaId)
        expect(conversation).toBeTruthy()
        expect(conversation.type).toBe("service")
        expect(message).toBeTruthy()
        expect(message.wamid).toBe("<WHATSAPP_MESSAGE_ID>")
        expect(runningMetrics).toBeTruthy()
        expect(runningMetrics.totalConversations).toBe(1)

    }, LONG_TEST_TIMEOUT)
})
