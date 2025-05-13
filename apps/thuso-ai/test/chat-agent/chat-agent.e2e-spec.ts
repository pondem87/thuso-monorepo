import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ThusoAiModule } from '../../src/thuso-ai.module';
import { CustomerRegistrationChatAgentEventPayload, LLMQueueMessage, LONG_TEST_TIMEOUT, MessengerEventPattern, RegisterCustomerToCRMEventPattern } from '@lib/thuso-common';
import { ChatAgentController } from '../../src/chat-agent/chat-agent.controller';
import { ThusoClientProxiesService } from '@lib/thuso-client-proxies';
import { BusinessProfileService } from '../../src/chat-agent/services/business-profile.service';
import { ChatMessageHistoryProvider } from '../../src/chat-agent/chat-message-history/chat-message-history-provider';
import AppDataSource from '../../src/db/datasource'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { v4 as uuidv4 } from "uuid"
import { Repository } from 'typeorm';
import { ChatHistory } from '../../src/chat-agent/entities/chat-history.entity';

describe('ThusoAiController (e2e)', () => {
    let app: INestApplication;
    let chatAgentController: ChatAgentController
    let chatHistoryRepo: Repository<ChatHistory>

    const clientProxy = {
        emitWhatsappQueue: jest.fn(),
        emitMgntQueue: jest.fn()
    }

    const businessProfileService = {
        getBusinessProfileByWabaId: null
    }

    const chatMessageHistoryProvider = {
        getChatMessageHistory: null
    }

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
                ThusoAiModule
            ],
        })
            .overrideProvider(ThusoClientProxiesService).useValue(clientProxy)
            .overrideProvider(BusinessProfileService).useValue(businessProfileService)
            .overrideProvider(ChatMessageHistoryProvider).useValue(chatMessageHistoryProvider)
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        chatAgentController = moduleFixture.get<ChatAgentController>(ChatAgentController)
        chatHistoryRepo = moduleFixture.get<Repository<ChatHistory>>(getRepositoryToken(ChatHistory))
    }, LONG_TEST_TIMEOUT);

    it('call llm', async () => {
        const payload: LLMQueueMessage = {
            wabaId: "WABA_ID",
            metadata: {
                display_phone_number: "DISPLAY_PHONE_NUMBER",
                phone_number_id: "PHONE_NUMBER_ID"
            },
            contact: {
                profile: {
                    name: "NAME"
                },
                wa_id: "WA_ID_2"
            },
            prompt: "What do you do?"
        }

        businessProfileService.getBusinessProfileByWabaId = jest.fn().mockResolvedValue({
            wabaId: payload.wabaId,
            accountId: "ACCOUNT_ID",
            profileId: "PROFILE_ID",
            name: "BUSINESS_NAME",
            tagline: "the future of computing",
            serviceDescription: "What do you do?",
            about: "started in 2022",
            imageLogoId: null,
            imageBannerId: null,
            updatedAt: new Date()
        })

        chatMessageHistoryProvider.getChatMessageHistory = jest.fn().mockResolvedValue({
            getChatHistory: () => ({ crmId: null }),
            addMessages: jest.fn(),
            setLastMessageTime: jest.fn(),
            addTopic: jest.fn()
        })

        await chatAgentController.processMessage(payload)

        expect(clientProxy.emitWhatsappQueue).toHaveBeenCalledWith(MessengerEventPattern, expect.anything())

    }, LONG_TEST_TIMEOUT);

    it("chat history update", async () => {
        const chatHistory: ChatHistory = chatHistoryRepo.create({
            wabaId: "1821972918291891",
            userId: "2778782653",
            phoneNumberId: "23322989389209"
        })

        await chatHistoryRepo.save(chatHistory)

        const data: CustomerRegistrationChatAgentEventPayload = {
            whatsAppNumber: chatHistory.userId,
            wabaId: chatHistory.wabaId,
            crmId: uuidv4()
        }

        await chatAgentController.processCustomerRegistration(data)

        const savedChatHis = await chatHistoryRepo.findOneBy({ userId: data.whatsAppNumber})

        expect(savedChatHis).toBeTruthy()
        expect(savedChatHis.crmId).toBe(data.crmId)

    })
});
