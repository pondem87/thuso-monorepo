import { assign, createActor, fromPromise, setup } from "xstate";
import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { LangGraphAgentProvider } from "../agents/langgraph-agent.provider";
import { ChatMessageHistoryProvider } from "../chat-message-history/chat-message-history-provider";
import { HumanMessage } from "@langchain/core/messages";
import { ClientProxy } from "@nestjs/microservices";
import { Contact, MessengerEventPattern, MessengerRMQMessage, Metadata, StateMachineActor, WhatsappRmqClient } from "@lib/thuso-common";
import { LoggingService } from "@lib/logging";
import { LLMFuncToolsProvider } from "../agents/llm-func-tools.provider";
import { LLMCallbackHandler } from "../utility/llm-callback-handler";
import { BusinessProfileService } from "../services/business-profile.service";

@Injectable()
export class LLMProcessStateMachineProvider {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly langGraphAgentProvider: LangGraphAgentProvider,
        private readonly llmFuncToolsProvider: LLMFuncToolsProvider,
        private readonly chatMessageHistoryProvider: ChatMessageHistoryProvider,
        @Inject(WhatsappRmqClient)
        private readonly whatsappRMQClient: ClientProxy,
        private readonly businessProfileService: BusinessProfileService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "llm-tools",
            file: "llm-process.state-machine.provider"
        })

        this.logger.info("initialize LLMProcessStateMachineProvider")
    }

    getActor(input: LPSInput): StateMachineActor<any, LPSContext> {
        return createActor(this.setUpStateMachine(), { input }) as StateMachineActor<any, LPSContext>
    }

    performLLMCall = async ({ input }: { input: { context: LPSContext } }): Promise<{ handler: LLMCallbackHandler }> => {
        const handler = new LLMCallbackHandler()

        const businessProfile = await this.businessProfileService.getBusinessProfileByWabaId(input.context.wabaId)

        if (!businessProfile || !businessProfile.profileId) {
            // send message to user
            const message: MessengerRMQMessage = {
                wabaId: input.context.wabaId,
                metadata: input.context.metadata,
                contact: input.context.contact,
                type: "text",
                text: "Agent awaiting configuration. Please try again later.",
                conversationType: "service"
            }

            this.whatsappRMQClient.emit(MessengerEventPattern, message)

            return { handler }
        }

        const sysMsgTxt =
            `You are a helpful customer service agent for a business named "${businessProfile.name}." Here is some basic information about the business.`
            + `\n\nCompany Information: ${businessProfile.serviceDescription}\nTagline: ${businessProfile.tagline}\nAbout: ${businessProfile.about}\n\n`
            + `Always refer to business documents for more detailed information using the document search tool. NEVER ASSUME INFORMATION NOT IN THE DOCUMENTS!`
            + `Products, services and promotions and other features maybe available through main menu by calling the take-action tool.`

        const compiledGraph = this.langGraphAgentProvider.getAgent(
            "gpt-4o-mini",
            sysMsgTxt,
            handler,
            this.llmFuncToolsProvider.getTools(input.context.contact, businessProfile.profileId)
        )

        const chatMessageHistory = await this.chatMessageHistoryProvider.getChatMessageHistory({
            wabaId: input.context.wabaId,
            userId: input.context.contact.wa_id,
            phoneNumberId: input.context.metadata.phone_number_id
        })

        const finalState = await compiledGraph.invoke({
            messages: [new HumanMessage(input.context.prompt)]
        }, { configurable: { thread_id: input.context.contact.wa_id } })

        await chatMessageHistory.addMessages([
            new HumanMessage(input.context.prompt),
            finalState.messages[finalState.messages.length - 1]
        ])

        const output = finalState.output.object

        let message: MessengerRMQMessage

        if (output.mode === "text") {
            message = {
                wabaId: input.context.wabaId,
                metadata: input.context.metadata,
                contact: input.context.contact,
                type: "text",
                text: output.text,
                conversationType: "service"
            }

            chatMessageHistory.addTopic(output.label)
            
        } else {
            switch (output.action) {
                case "send-main-menu":
                    message = {
                        wabaId: input.context.wabaId,
                        metadata: input.context.metadata,
                        contact: input.context.contact,
                        type: "menu",
                        menuId: "main-menu",
                        conversationType: "service"
                    }
                    break;

                default:
                    this.logger.warn("Unknown action", { wabaId: input.context.wabaId, llmOutput: output })
                    message = null
                    break;
            }
        }

        // send message to user
        if (message) this.whatsappRMQClient.emit(MessengerEventPattern, message)

        return { handler }
    }

    updateUsageStats = async ({ input }: { input: { context: LPSContext } }): Promise<void> => {
        const usage = input.context.llmCallbackHandler.getUsage()
    }

    private setUpStateMachine() {
        return setup({
            types: {
                context: {} as LPSContext,
                input: {} as LPSInput,
                children: {} as {
                    performLLMCall: 'performLLMCall';
                    updateUsageStats: 'updateUsageStats';
                }
            },
            actors: {
                performLLMCall: fromPromise(this.performLLMCall),
                updateUsageStats: fromPromise(this.updateUsageStats)
            }
        })
            .createMachine({
                /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgBsCBbAWgAcAnLAYzniRHK1gEsAXVrDfEAD0SkAjADYADOgCeiIQCYALADp5ATjUrZAZgDsY8QFZ525GhBEyVWvUUBhABZgaAawBCAQwJuMdXszaduXgEEYTkpRFk5E3RzCmo6WFhFAEkMDgAZdIBZABUsLAIGUD8OLh5GYOE9RVkADhU9WX1whFltEUV9aLMSOKtExQBxMAwwSjd2MAAlOGYMWDBfFlLAisEhIQkQaQRNeSETEyA */
                id: "llm-process",

                context: ({ input }) => ({
                    ...input
                }),
                initial: "PerformLLMCall",
                states: {
                    PerformLLMCall: {
                        invoke: {
                            id: "performLLMCall",
                            src: "performLLMCall",
                            input: ({ context }) => ({ context }),
                            onDone: {
                                target: "UpdateUsageStats",
                                actions: assign({
                                    llmCallbackHandler: ({ event }) => event.output.handler
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
                    UpdateUsageStats: {
                        invoke: {
                            id: "updateUsageStats",
                            src: "updateUsageStats",
                            input: ({ context }) => ({ context }),
                            onDone: {
                                target: "Complete"
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
                        tags: ["final", "failure"],
                        entry: ({ context }) => {
                            this.logger.error("LLM process failed.", { error: context.error, contact: context.contact })
                        }
                    }
                }
            })
    }
}

export type LPSContext = {
    wabaId: string;
    metadata: Metadata;
    contact: Contact;
    prompt: string;
    error?: any;
    llmCallbackHandler?: LLMCallbackHandler
}

export type LPSInput = {
    wabaId: string;
    contact: Contact;
    metadata: Metadata;
    prompt: string;
}