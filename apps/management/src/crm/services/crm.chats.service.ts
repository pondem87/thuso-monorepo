import { LoggingService } from "@lib/logging";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { error } from "console";
import { Logger } from "winston";

@Injectable()
export class CrmChatsService {
    private logger: Logger
    private aiServerRoot: string

    constructor(
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "crm",
            file: "crm.chats.service"
        })

        this.logger.info("Initialised Crm Chats Controller")

        this.aiServerRoot = `http://${this.configService.get<string>("AI_SERVER_URL")}:${this.configService.get<string>("AI_SERVER_PORT")}`
    }

    async getMessages(phoneNumberId: string, userId: string, skip: number, take: number) {
        try {
            const response = await fetch(`${this.aiServerRoot}/ai/chat-agent/${phoneNumberId}/${userId}/messages?skip=${skip}&take=${take}`,
                {
                    method: "GET",
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`,
                    }
                }
            )

            const data = await response.json()
            this.logger.debug("Messages:", {data, response})

            if (!response.ok) {
                this.logger.error("Faile to retrieve messages", { response, error_data: data })
                throw new error("Chats API failure")
            }

            return data
        } catch (error) {
            this.logger.error("Error while retrieving messages", {error})
            throw new HttpException("Error while retrieving messages", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
    
    async getChats(wabaId: string, skip: number, take: number, topic: string) {
        try {
            const response = await fetch(`${this.aiServerRoot}/ai/chat-agent/${wabaId}/chats?skip=${skip}&take=${take}${ topic ? `&topic=${topic}` : ''}`,
                {
                    method: "GET",
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`,
                    }
                }
            )

            const data = await response.json()
            this.logger.debug("Chats:", {data, response})

            if (!response.ok) {
                this.logger.error("Faile to retrieve messages", { response, error_data: data })
                throw new error("Chats API failure")
            }

            return data
        } catch (error) {
            this.logger.error("Error while retrieving chats", {error})
            throw new HttpException("Error while retrieving chats", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}