import { LoggingService } from "@lib/logging";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Logger } from "winston";
import { ChatHistory } from "../entities/chat-history.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { ChatMessage } from "../entities/chat-message.entity";
import { GetChatsDto } from "../dto/get-chats.dto";
import { GetMessagesDto } from "../dto/get-messages.dto";

@Injectable()
export class ChatMessageHistoryApiService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @InjectRepository(ChatHistory)
        private readonly chatHistoryRepo: Repository<ChatHistory>,
        @InjectRepository(ChatMessage)
        private readonly chatMessageRepo: Repository<ChatMessage>
    ) {
        this.logger = this.loggingService.getLogger({
            module: "chat-agent",
            file: "chat-message-history.api.service"
        })

        this.logger.info("Initialised Chat message history api service")
    }

    async getMessages({ userId, phoneNumberId }: GetMessagesDto, skip, take): Promise<[ChatMessage[], number]> {
        try {
            return await this.chatMessageRepo.findAndCount({ where: { chatHistory: { userId, phoneNumberId } }, skip, take, order: { createdAt: "DESC" } })
        } catch (error) {
            this.logger.error("Error while retrieving messages", { error })
            throw new HttpException("Error while getting messages", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
    
    async getChats({ wabaId }: GetChatsDto,  skip, take, topic): Promise<[ChatHistory[], number]> {
        try {
            this.logger.debug("Getting chats", { wabaId, skip, take, topic})
            return await this.chatHistoryRepo.findAndCount({ where: { wabaId, lastTopic: topic }, skip, take, order: { lastMessageTime: "DESC" } })
        } catch (error) {
            this.logger.error("Error whie retrieving chats", { error })
            throw new HttpException("Error while getting chats", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}