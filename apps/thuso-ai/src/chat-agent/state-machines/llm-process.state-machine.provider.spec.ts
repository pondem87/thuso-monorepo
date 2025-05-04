import { Test, TestingModule } from "@nestjs/testing";
import { LLMProcessStateMachineProvider, LPSInput } from "./llm-process.state-machine.provider";
import { LangGraphAgentProvider } from "../agents/langgraph-agent.provider";
import { ChatMessageHistoryProvider } from "../chat-message-history/chat-message-history-provider";
import { AnyActorRef, waitFor } from "xstate";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ConfigService } from "@nestjs/config";
import { LLMCallbackHandler } from "../utility/llm-callback-handler";
import { LoggingService, mockedLoggingService } from "@lib/logging";
import { LLMFuncToolsProvider } from "../agents/llm-func-tools.provider";
import { MessengerEventPattern } from "@lib/thuso-common";
import { BusinessProfileService } from "../services/business-profile.service";
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies";
import { TokenUsageService } from "../services/token-usage.service";

describe('LLMProcessStateMachineProvider', () => {
	let provider: LLMProcessStateMachineProvider;

	const mockedLLMFuncToolsProvider = {
		getTools: jest.fn().mockReturnValue([])
	}

	let mockCallbackHandler: LLMCallbackHandler = null

	const mockBusinessProfileService = {
		getBusinessProfileByWabaId: null
	}

	const mockLLMOutput = {
		llmOutput: {
			tokenUsage: {
				promptTokens: 100,
				completionTokens: 150
			}
		},
		"generations": null
	}

	const mockInvokeGraph = jest.fn().mockImplementation(async () => {
		// call handle method twice
		mockCallbackHandler.handleLLMEnd(mockLLMOutput, "some_random_id")
		mockCallbackHandler.handleLLMEnd(mockLLMOutput, "some_random_id")

		return {
			messages: [
				new HumanMessage("This is the dummy prompt"),
				new AIMessage("This is the AI response")
			],
			output: {
				object: {
					mode: "text",
					text: "This is the AI structured response",
					label: "Information Seeking"
				}
			}
		}
	})

	const mockLangGraphAgentProvider = {
		getAgent: jest.fn().mockImplementation((...params) => {
			mockCallbackHandler = params[2]
			return {
				invoke: mockInvokeGraph
			}
		})
	}

	const mockChatMessageHistory = {
		getChatHistory: jest.fn().mockResolvedValue({
			wabaId: "config.wabaId",
            userId: "config.userId",
			phoneNumberId: "config.phoneNumberId"
		}),
		getMessages: jest.fn().mockResolvedValue([]),
		addMessages: jest.fn(),
		addTopic: jest.fn(),
		setLastMessageTime: jest.fn().mockResolvedValue(undefined)
	}

	const mockChatMessageHistoryProvider = {
		getChatMessageHistory: jest.fn().mockReturnValue(mockChatMessageHistory)
	}

	const mockWhatsappRmqClient = {
		emitWhatsappQueue: jest.fn()
	}

	const mockConfigService = {
		get: jest.fn().mockImplementation((input) => input)
	}

	afterEach(() => {
		mockWhatsappRmqClient.emitWhatsappQueue.mockClear()
		mockInvokeGraph.mockClear()
	})

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				LLMProcessStateMachineProvider,
				{
					provide: LoggingService,
					useValue: mockedLoggingService
				},
				{
					provide: LangGraphAgentProvider,
					useValue: mockLangGraphAgentProvider
				},
				{
					provide: LLMFuncToolsProvider,
					useValue: mockedLLMFuncToolsProvider
				},
				{
					provide: ChatMessageHistoryProvider,
					useValue: mockChatMessageHistoryProvider
				},
				{
					provide: ThusoClientProxiesService,
					useValue: mockWhatsappRmqClient
				},
				{
					provide: BusinessProfileService,
					useValue: mockBusinessProfileService
				},
				{
					provide: ConfigService,
					useValue: mockConfigService
				},
				{
					provide: TokenUsageService,
					useValue: {
						addUsedTokens: jest.fn()
					}
				}
			],
		}).compile();

		provider = module.get<LLMProcessStateMachineProvider>(LLMProcessStateMachineProvider);
	});

	it('should be defined', () => {
		expect(provider).toBeDefined();
	});

	it('should send text llm response', async () => {
		const input: LPSInput = {
			wabaId: "some-waba-id",
			metadata: {
				display_phone_number: "DISPLAY_PHONE_NUMBER",
				phone_number_id: "PHONE_NUMBER_ID"
			},
			contact: {
				profile: {
					name: "some-guy"
				},
				wa_id: "777888999"
			},
			prompt: "some-guy's prompt"
		}

		mockBusinessProfileService.getBusinessProfileByWabaId = jest.fn().mockResolvedValue({
			wabaId: "some-waba-id",
			profileId: "profile_001",
			name: "Test Business",
			tagline: "Your trusted partner",
			serviceDescription: "Providing the best services",
			about: "We have been in business for 10 years...",
			imageLogoId: "logo_123",
			imageBannerId: "banner_456",
			updatedAt: new Date(),
		})

		const llmProcessActor = provider.getActor(input)

		llmProcessActor.start()

		await waitFor(
			llmProcessActor as AnyActorRef,
			(snapshot) => snapshot.hasTag("final")
		)

		expect(llmProcessActor.getSnapshot().matches("Complete")).toBe(true)
		expect(mockInvokeGraph).toHaveBeenCalledTimes(1)
		expect(mockWhatsappRmqClient.emitWhatsappQueue).toHaveBeenCalledTimes(1)
		expect(mockChatMessageHistory.addTopic).toHaveBeenCalledWith("Information Seeking")

		delete input.prompt
		expect(mockWhatsappRmqClient.emitWhatsappQueue).toHaveBeenCalledWith(
			MessengerEventPattern,
			{
				...input,
				type: "text",
				text: "This is the AI structured response",
				conversationType: "service"
			}
		)
	})

	it('when business profile is null', async () => {
		const input: LPSInput = {
			wabaId: "some-waba-id",
			metadata: {
				display_phone_number: "DISPLAY_PHONE_NUMBER",
				phone_number_id: "PHONE_NUMBER_ID"
			},
			contact: {
				profile: {
					name: "some-guy"
				},
				wa_id: "777888999"
			},
			prompt: "some-guy's prompt"
		}

		mockBusinessProfileService.getBusinessProfileByWabaId = jest.fn().mockResolvedValue(null)

		const llmProcessActor = provider.getActor(input)

		llmProcessActor.start()

		await waitFor(
			llmProcessActor as AnyActorRef,
			(snapshot) => snapshot.hasTag("final")
		)

		expect(llmProcessActor.getSnapshot().matches("Complete")).toBe(true)
		expect(mockInvokeGraph).toHaveBeenCalledTimes(0)
		expect(mockWhatsappRmqClient.emitWhatsappQueue).toHaveBeenCalledTimes(1)

		delete input.prompt
		expect(mockWhatsappRmqClient.emitWhatsappQueue).toHaveBeenCalledWith(
			MessengerEventPattern,
			{
				...input,
				type: "text",
				text: "Agent awaiting configuration. Please try again later.",
				conversationType: "service"
			}
		)
	})
});