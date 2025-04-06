import { Test, TestingModule } from "@nestjs/testing";
import { LangGraphAgentProvider } from "./langgraph-agent.provider";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod"
import { LoggingService, mockedLoggingService } from "@lib/logging";
import { generateRandomString, LONG_TEST_TIMEOUT } from "@lib/thuso-common";
import { LLMCallbackHandler } from "../utility/llm-callback-handler";

describe('LangGraphAgentProvider', () => {
    let provider: LangGraphAgentProvider;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({ isGlobal: true })],
            controllers: [],
            providers: [
                LangGraphAgentProvider,
                ConfigService,
                {
                    provide: LoggingService,
                    useValue: mockedLoggingService
                }
            ],
        }).compile();

        provider = module.get<LangGraphAgentProvider>(LangGraphAgentProvider);
    }, LONG_TEST_TIMEOUT);

    it('should be defined', () => {
        expect(provider).toBeDefined();
    });

    it("should return a compiled graph, call a tool, and get usage", async () => {
        const f = jest.fn()
        const handler = new LLMCallbackHandler()
        const modelName = "gpt-4o-mini"
        const sysMsgTxt = "You are Thuso, a helpful AI customer assistant."
        const cg = provider.getAgent(modelName, sysMsgTxt, handler, [
            new DynamicStructuredTool({
                func: async () => {
                    f()
                    return "Pfitztronic"
                },
                name: "get-company-name",
                description: "Get company name",
                schema: z.object({})
            })
        ])
        const finState = await cg.invoke({
            messages: [new HumanMessage("What is the company name?")],
        }, { configurable: { thread_id: generateRandomString(10)}})

        // check if function called
        expect(f).toHaveBeenCalledTimes(1)

        // check if ai responded
        expect((finState.messages[finState.messages.length - 1] as BaseMessage).getType()).toBe("ai")
        expect(finState.output).toEqual(expect.objectContaining({
            object: {
                mode: "text",
                text: expect.stringContaining("Pfitztronic"),
                label: expect.any(String)
            }
        }))

        // check if usage computed
        const usage = handler.getUsage();
        expect(usage.inputTokens).toBeGreaterThan(0);
        expect(usage.outputTokens).toBeGreaterThan(0);
    }, LONG_TEST_TIMEOUT)

    it("should return a compiled graph, referrence system message", async () => {
        const handler = new LLMCallbackHandler()
        const modelName = "gpt-4o-mini"
        const sysMsgTxt = "You are Thuso, a helpful AI customer assistant."
        const cg = provider.getAgent(modelName, sysMsgTxt, handler, [])
        const finState = await cg.invoke({
            messages: [new HumanMessage("What is your name?")],
        }, { configurable: { thread_id: generateRandomString(10)}})

        // check if ai responded
        expect((finState.messages[finState.messages.length - 1] as BaseMessage).getType()).toBe("ai")

        // check if system message referenced
        expect(finState.output).toEqual(expect.objectContaining({
            object: {
                mode: "text",
                text: expect.stringContaining("Thuso"),
                label: expect.any(String)
            }
        }))
    }, LONG_TEST_TIMEOUT)

    it("should return a compiled graph, should return menu action", async () => {
        const handler = new LLMCallbackHandler()
        const modelName = "gpt-4o-mini"
        const sysMsgTxt = "You are Thuso, a helpful AI customer assistant."
        const cg = provider.getAgent(modelName, sysMsgTxt, handler, [
            new DynamicStructuredTool({
                func: async (input) => {
                    return `Action: "${input.action}" will be implemented by downstream application.`
                },
                name: "take-action",
                description: "When human requests action in this list: [send main menu]",
                schema: z.object({
                    action: z.string().describe("action requested")
                })
            })
        ])
        const finState = await cg.invoke({
            messages: [new HumanMessage("Can I see the menu?")],
        }, { configurable: { thread_id: generateRandomString(10)}})

        // check if ai responded
        expect((finState.messages[finState.messages.length - 1] as BaseMessage).getType()).toBe("ai")

        // check if system message referenced
        expect(finState.output).toEqual(expect.objectContaining({
            object: {
                mode: "action",
                action: "send-main-menu"
            }
        }))
    }, LONG_TEST_TIMEOUT)

});