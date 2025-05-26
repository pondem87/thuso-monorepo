import { Injectable } from "@nestjs/common";
import { StoredMessage } from "@langchain/core/messages";
import { InjectRepository } from "@nestjs/typeorm";
import { ChatHistory } from "../entities/chat-history.entity";
import { Repository } from "typeorm";
import { Logger } from "winston";
import { ChatMessage } from "../entities/chat-message.entity";
import { LoggingService } from "@lib/logging";
import { ChatTopic } from "../entities/chat-topic.entity";
import { CustomerRegistrationChatAgentEventPayload, getDateOnly, NewTopicLLMEventPattern, NewTopicLLMEventPayload } from "@lib/thuso-common";
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies";
import { CustomerData } from "../entities/customer-data.entity";


@Injectable()
export class ChatMessageHistoryService {
	private logger: Logger

	constructor(
		@InjectRepository(ChatHistory)
		private readonly chatHistoryRepository: Repository<ChatHistory>,
		@InjectRepository(ChatMessage)
		private readonly chatMessageRepository: Repository<ChatMessage>,
		@InjectRepository(ChatTopic)
		private readonly chatTopicRepository: Repository<ChatTopic>,
		@InjectRepository(CustomerData)
		private readonly customerDataRepository: Repository<CustomerData>,
		private readonly loggingService: LoggingService,
		private readonly clientService: ThusoClientProxiesService
	) {
		this.logger = this.loggingService.getLogger({
			module: "llm-tools",
			file: "chat-message-history.service"
		})
	}

	async getUsersChatHistory(phoneNumberId: string, userId: string): Promise<ChatHistory | null> {
		try {
			return await this.chatHistoryRepository.findOne({
				where: {
					userId, phoneNumberId
				}
			})
		} catch (error) {
			this.logger.error("Error retrieving chathistory from database.", { error })
			return null
		}
	}

	async createChatMessage(chatHistory: ChatHistory, message: StoredMessage): Promise<ChatMessage | null> {
		try {
			const chatMessage = new ChatMessage()
			chatMessage.chatHistory = chatHistory
			chatMessage.message = message
			return await this.chatMessageRepository.save(chatMessage)
		} catch (error) {
			this.logger.error("")
			return null
		}
	}

	async getChatMessages(chatHistory: ChatHistory, chatHistoryWindowLength: number): Promise<ChatMessage[]> {
		try {
			return await this.chatMessageRepository.find({
				where: {
					chatHistory: {
						userId: chatHistory.userId, phoneNumberId: chatHistory.phoneNumberId
					}
				},
				take: chatHistoryWindowLength
			})
		} catch (error) {
			this.logger.error("Error retrieving messages", { error })
			return []
		}
	}

	async saveChatHistory(chatHistory: ChatHistory): Promise<ChatHistory | null> {
		try {
			return await this.chatHistoryRepository.save(chatHistory)
		} catch (error) {
			this.logger.error("Error saving chatHistory", { error })
			return null
		}
	}

	async addTopic(chatHistory: ChatHistory, label: string): Promise<void> {
		try {
			const date = getDateOnly(new Date())
			const topic = await this.chatTopicRepository.findOneBy({ chatHistory: { id: chatHistory.id }, date, label })

			if (!topic) {
				// add topic
				await this.chatTopicRepository.save(
					this.chatTopicRepository.create({
						date,
						label,
						chatHistory
					})
				)
				// update chathistory
				await this.chatHistoryRepository.update({ id: chatHistory.id }, { lastTopic: label })
				// message crm of new topic
				if (chatHistory.customerData) {
					this.clientService.emitMgntQueue(
						NewTopicLLMEventPattern,
						{
							crmId: chatHistory.customerData.id,
							topicLabel: label
						} as NewTopicLLMEventPayload
					)
				}
			}
		} catch (error) {
			this.logger.error("Error saving topic", { wabaId: chatHistory.wabaId, error })
		}
	}

	async processRegistration(data: CustomerRegistrationChatAgentEventPayload) {
		try {
			if (data.phone_number_id) {
				for (const phone_number_id of data.phone_number_id) {
					const chatHistory = new ChatHistory()
					chatHistory.wabaId = data.wabaId
					chatHistory.userId = data.whatsAppNumber
					chatHistory.phoneNumberId = phone_number_id
					chatHistory.customerData = await this.customerDataRepository.save(
						this.customerDataRepository.create({
							id: data.crmId,
							fullName: data.fullname
						})
					)
					await this.chatHistoryRepository.save(chatHistory)
				}
			} else {
				const chats = await this.chatHistoryRepository.findBy({ userId: data.whatsAppNumber, wabaId: data.wabaId })
				for (const chat of chats) {
					// update chathistory
					this.logger.info("ChatHistory for update", { chatHistory: chat, crmId: data.crmId })

					const customerData = await this.customerDataRepository.save(
						this.customerDataRepository.create({
							id: data.crmId,
							fullName: data.fullname
						})
					)
					
					chat.customerData = customerData

					await this.chatHistoryRepository.save(chat)

					this.clientService.emitMgntQueue(
						NewTopicLLMEventPattern,
						{
							crmId: data.crmId,
							topicLabel: chat.lastTopic
						} as NewTopicLLMEventPayload
					)
				}
			}
		} catch (error) {
			this.logger.error("Error while processing user registration message", { error })
		}
	}

}