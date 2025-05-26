import { assign, createActor, fromPromise, setup } from "xstate";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { LangGraphAgentProvider } from "../agents/langgraph-agent.provider";
import { ChatMessageHistoryProvider } from "../chat-message-history/chat-message-history-provider";
import { HumanMessage } from "@langchain/core/messages";
import { Contact, MessengerEventPattern, MessengerRMQMessage, Metadata, StateMachineActor } from "@lib/thuso-common";
import { LoggingService } from "@lib/logging";
import { LLMFuncToolsProvider } from "../agents/llm-func-tools.provider";
import { LLMCallbackHandler } from "../utility/llm-callback-handler";
import { BusinessProfileService } from "../services/business-profile.service";
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies";
import { TokenUsageService } from "../services/token-usage.service";

@Injectable()
export class LLMProcessStateMachineProvider {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly langGraphAgentProvider: LangGraphAgentProvider,
        private readonly llmFuncToolsProvider: LLMFuncToolsProvider,
        private readonly chatMessageHistoryProvider: ChatMessageHistoryProvider,
        private readonly clientsService: ThusoClientProxiesService,
        private readonly businessProfileService: BusinessProfileService,
        private readonly tokenUsageService: TokenUsageService
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

            this.clientsService.emitWhatsappQueue(MessengerEventPattern, message)

            return { handler }
        }

        let sysMsgTxt =
            `You are ${ businessProfile?.botname ? businessProfile.botname : 'Thuso'}, a helpful customer service agent for a business named "${businessProfile.name}." Here is some basic information about the business.`
            + `\n\nCompany Information: ${businessProfile.serviceDescription}\nTagline: ${businessProfile.tagline}\nAbout: ${businessProfile.about}\n\n`
            + `Always refer to business documents for more detailed information using the document-search-tool. NEVER ASSUME INFORMATION NOT IN THE DOCUMENTS! `
            + `Products, services and promotions and other features maybe available through main menu by calling the take-action tool.\n\n`;

        if (businessProfile.greeting) {
            sysMsgTxt += `THE OFFICIAL COMPANY GREETING IS "${businessProfile.greeting}"\n\n`
        }

        const chatMessageHistory = await this.chatMessageHistoryProvider.getChatMessageHistory({
            wabaId: input.context.wabaId,
            userId: input.context.contact.wa_id,
            phoneNumberId: input.context.metadata.phone_number_id
        })

        const chatHistory = chatMessageHistory.getChatHistory()

        // if user not in crm alter the prompt
        if (!chatHistory.customerData) {
            sysMsgTxt += `ALERT! You are engaging with a new customer, therefore make sure to request the following details: Forenames, Surname, City, Country. You can include a prompt like: "To help us provide you with better service, may I please have some details such as your full name, city and country?" Then, save this information using the save-customer-data-tool.`
        } else {
            sysMsgTxt += `Current client's name is: ${chatHistory.customerData.fullName.replace(/\b\w/g, (char) => char.toUpperCase())}`
        }

        const compiledGraph = this.langGraphAgentProvider.getAgent(
            "gpt-4.1-mini",
            sysMsgTxt,
            handler,
            this.llmFuncToolsProvider.getTools(input.context.contact, businessProfile.accountId, businessProfile.profileId)
        )

        const finalState = await compiledGraph.invoke({
            messages: [new HumanMessage(input.context.prompt)]
        }, { configurable: { thread_id: `${input.context.contact.wa_id}+${input.context.metadata.phone_number_id}` } })

        await chatMessageHistory.addMessages([
            new HumanMessage(input.context.prompt),
            finalState.messages[finalState.messages.length - 1]
        ])

        await chatMessageHistory.setLastMessageTime()

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
        if (message) this.clientsService.emitWhatsappQueue(MessengerEventPattern, message)

        return { handler }
    }

    updateUsageStats = async ({ input }: { input: { context: LPSContext } }): Promise<void> => {
        const usage = input.context.llmCallbackHandler.getUsage()
        this.logger.debug("Calling addUsedTokens function", usage)
        await this.tokenUsageService.addUsedTokens(input.context.wabaId, usage)
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
    llmCallbackHandler?: LLMCallbackHandler,
}

export type LPSInput = {
    wabaId: string;
    contact: Contact;
    metadata: Metadata;
    prompt: string;
}