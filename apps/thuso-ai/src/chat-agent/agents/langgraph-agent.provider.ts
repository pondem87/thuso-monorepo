import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { Annotation, messagesStateReducer, StateGraph } from "@langchain/langgraph";
import { AIMessage, BaseMessage, RemoveMessage, SystemMessage } from "@langchain/core/messages";
import { ConfigService } from "@nestjs/config";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres"
import { LLMCallbackHandler } from "../utility/llm-callback-handler";
import { LoggingService } from "@lib/logging";
import { checkTableExists } from "../utility/check-database";
import { z } from "zod";

const GraphStateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
        default: () => []
    }),
    summary: Annotation<string>,
    output: Annotation<StrucLLMOutput>
})

const strucLLMOutputSchema = z.object({
    object: z.discriminatedUnion("mode", [
        z.object({
            mode: z.literal("action").describe("Indicates that the output is an action. The named action will be executed downstream"),
            action: z
                .enum(["send-main-menu"])
                .describe("The specific action to execute"),
        }),
        z.object({
            mode: z.literal("text").describe("Indicates that the output is plain text"),
            text: z.string().describe("The text content of the response"),
            label: z.enum([
                "Purchase Intent",
                "Information Seeking",
                "Problem Resolution",
                "Positive Feedback",
                "Negative Feedback",
                "Cancellation/Refund Request",
                "Suggestions",
                "Unresolved Issue"
            ]).describe("The semantic category of the message")
        }),
    ])
});

export type StrucLLMOutput = z.infer<typeof strucLLMOutputSchema>;

@Injectable()
export class LangGraphAgentProvider {
    private logger: Logger
    private maxMessages: number
    private minMessages: number
    private checkPointer: PostgresSaver
    private connString: string

    constructor(
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "llm-tools",
            file: "langgraph-agent.provider"
        })

        this.logger.info("Initializing LangGraphAgentProvider")

        this.minMessages = Number(this.configService.get<string>("CHAT_HISTORY_WINDOW_LENGTH")) || 8
        this.maxMessages = this.minMessages * 2

        this.connString = `postgresql://${encodeURIComponent(configService.get<string>("DB_USERNAME"))}:${encodeURIComponent(configService.get<string>("DB_PASSWORD"))}@${configService.get<string>("DB_HOST")}`
            + `:${configService.get<string>("DB_PORT")}/${configService.get<string>("DB_DATABASE")}-ai`
            + `?sslmode=verify-full&sslrootcert=${configService.get<string>("DB_CERT_PATH")}`

        this.checkPointer = PostgresSaver.fromConnString(this.connString);
    }

    async setUpCheckPointer(): Promise<void> {
        if (!(await checkTableExists('checkpoint_migrations', this.connString))) {
            this.logger.info("Generating checkpointer tables.")
            await this.checkPointer.setup()
        }
    }

    getAgent(modelName: string, sysMsgTxt: string, handler: LLMCallbackHandler, tools: DynamicStructuredTool[]) {
        const toolNode = new ToolNode(tools)

        const model = new ChatOpenAI({
            openAIApiKey: this.configService.get<string>("OPENAI_API_KEY"),
            model: modelName,
            temperature: 0,
            callbacks: [handler],
            tags: ["model-tracker"]
        }).bindTools(tools)

        const outputModel = new ChatOpenAI({
            openAIApiKey: this.configService.get<string>("OPENAI_API_KEY"),
            model: modelName,
            temperature: 0,
            callbacks: [handler],
            tags: ["model-tracker"]
        }).withStructuredOutput(strucLLMOutputSchema)

        const summaryModel = new ChatOpenAI({
            openAIApiKey: this.configService.get<string>("OPENAI_API_KEY"),
            model: modelName,
            temperature: 0,
            maxCompletionTokens: 1000,
            callbacks: [handler],
            tags: ["model-tracker"]
        })

        const shouldContinue = ({ messages }: typeof GraphStateAnnotation.State) => {
            const lastMessage = messages[messages.length - 1];

            this.logger.debug("Agent conditional node: shouldContinue", { lastMessage })


            if (lastMessage.getType() !== "ai" || !(lastMessage as AIMessage).tool_calls?.length) {
                // LLM did not call a tool or this is not an AI message so we end
                return "internode";
            }

            // If the LLM makes a tool call, then we route to the "tools" node
            return "tools";
        }

        const callModel = async (state: typeof GraphStateAnnotation.State) => {
            const sysMsg = new SystemMessage(`${sysMsgTxt}\n\nSummary from earlier conversation:\n${state.summary}`)
            const response = await model.invoke([sysMsg, ...state.messages]);

            // We return a list, because this will get added to the existing list
            return { messages: [response] };
        }

        const interNode = async (state: typeof GraphStateAnnotation.State) => {
            return {}
        }

        const shouldSummarise = ({ messages }: typeof GraphStateAnnotation.State) => {
            if (messages.length >= this.maxMessages) {
                return "summariser"
            }

            return "formatter"
        }

        const summarise = async (state: typeof GraphStateAnnotation.State) => {
            const removeMessages: RemoveMessage[] = []
            const summaryMessages: BaseMessage[] = []
            for (let i = 0; i < (state.messages.length - this.minMessages); i++) {
                removeMessages.push(new RemoveMessage({ id: state.messages[i].id }))
                summaryMessages.push(state.messages[i])
            }

            const sysMsg = new SystemMessage(`
                    You are to summarise the the following messages and combine with the previous summary.
                    The summary should not exceed 750 words.

                    The previous summary is: "${state.summary}"
                `)

            const response = await summaryModel.invoke([sysMsg, ...summaryMessages])
            const summary = response.content

            return {
                summary: summary,
                messages: removeMessages
            }
        }

        const formatOutput = async (state: typeof GraphStateAnnotation.State) => {
            const sysMsg = new SystemMessage(`
                You are to format the response according to the schema by figuring out if an "action" is required or plain text response
            `)

            const response = await outputModel.invoke([sysMsg, ...state.messages])

            return {
                output: response
            }
        }

        // Define a new graph
        const workflow = new StateGraph(GraphStateAnnotation)
            .addNode("agent", callModel)
            .addNode("summariser", summarise)
            .addNode("internode", interNode)
            .addNode("tools", toolNode)
            .addNode("formatter", formatOutput)
            .addEdge("__start__", "agent") // __start__ is a special name for the entrypoint
            .addConditionalEdges("agent", shouldContinue)
            .addEdge("tools", "agent")
            .addConditionalEdges("internode", shouldSummarise)
            .addEdge("summariser", "formatter")
            .addEdge("formatter", "__end__")

        // Finally, we compile it into a LangChain Runnable.
        return workflow.compile({
            checkpointer: this.checkPointer
        });
    }
}