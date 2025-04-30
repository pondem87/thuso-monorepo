import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { BaseMessage, mapStoredMessagesToChatMessages, mapChatMessagesToStoredMessages } from "@langchain/core/messages";
import { ChatHistory } from "../entities/chat-history.entity";
import { Logger } from "winston";
import { ChatMessageHistoryService } from "./chat-message-history.service";
import { ChatMessageHistoryConfig } from "./chat-message-history-provider";


export class ChatMessageHistory extends BaseListChatMessageHistory {
    lc_namespace = ["langchain", "stores", "message"];

    private chatHistoryConfig: { userId: string, phoneNumberId: string }
    private chatHistory: ChatHistory
    private logger: Logger
    private chatHistoryWindowLength: number
    private chatMessageHistoryService: ChatMessageHistoryService

    constructor(
        logger: Logger,
        chatMessageHistoryService: ChatMessageHistoryService,
        chatHistoryWindowLength: number
    ) {
        super();

        this.logger = logger
        this.chatMessageHistoryService = chatMessageHistoryService
        this.chatHistoryWindowLength = chatHistoryWindowLength
    }

    async init(config: ChatMessageHistoryConfig) {
        this.chatHistoryConfig = config

        this.logger.debug("Initializing chatHistory", {config})

        try {
            this.chatHistory = await this.chatMessageHistoryService.getUsersChatHistory(
                this.chatHistoryConfig.phoneNumberId,
                this.chatHistoryConfig.userId
            )

            if (this.chatHistory == null) {
                this.chatHistory = new ChatHistory()
                this.chatHistory.wabaId = config.wabaId
                this.chatHistory.userId = config.userId
                this.chatHistory.phoneNumberId = config.phoneNumberId
                this.chatHistory = await this.chatMessageHistoryService.saveChatHistory(this.chatHistory)
            }

            this.logger.debug("Initialized chatHistory", {chatHistory: this.chatHistory})

        } catch (error) {
            this.logger.error("Failed to initialize ChatMesageHistory", error)
            this.chatHistory = null
        }
    }

    async getMessages(): Promise<BaseMessage[]> {
        return mapStoredMessagesToChatMessages(
            (await this.chatMessageHistoryService.getChatMessages(this.chatHistory, this.chatHistoryWindowLength))
                .map((chatMessage) => chatMessage.message)
        )
    }

    async addMessage(message: BaseMessage): Promise<void> {
        const serializedMessages = mapChatMessagesToStoredMessages([message])
        await this.chatMessageHistoryService.createChatMessage(this.chatHistory, serializedMessages[0]) 
    }

    async addMessages(messages: BaseMessage[]): Promise<void> {
        for (let i = 0; i < messages.length; i++) {
            await this.addMessage(messages[i])
        }
    }

    async addTopic(label: string): Promise<void> {
        return this.chatMessageHistoryService.addTopic(this.chatHistory, label)
    }

    async setLastMessageTime(): Promise<void> {
        this.chatHistory.lastMessageTime = new Date()
        await this.chatMessageHistoryService.saveChatHistory(this.chatHistory)
    }

    async clear(): Promise<void> {
        this.logger.warn("Unimplemented method called.")
    }

    getChatHistory(): ChatHistory {
        return this.chatHistory
    }

}
