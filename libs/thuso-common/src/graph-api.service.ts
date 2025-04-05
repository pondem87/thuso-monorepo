import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Logger } from "winston";
import axios from "axios";
import { LoggingService } from "@lib/logging";
import { MessageBody, MessagesResponse } from "@lib/thuso-common";
import path from "path";
const FormData = require("form-data");

@Injectable()
export class GraphAPIService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "whatsapp-messenger",
            file: "graph-api.service"
        })

        this.logger.info("Initialising GraphAPIService")
    }

    async messages(businessToken: string, phoneNumberId: string, messageBody: MessageBody): Promise<MessagesResponse|null> {
        try {

            this.logger.debug("Sending => Message: ", {messageBody})

            const response = await fetch(
                `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/${phoneNumberId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${businessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(messageBody)
                });

            if (!response.ok) {
                this.logger.error("Failed to send message.", { response: JSON.stringify(await response.json()) })
                return null
            }

            const responseBody = await response.json() as MessagesResponse;
            this.logger.debug("Message sent successfully.", { response: responseBody })
            return responseBody

        } catch (error) {
            this.logger.error("Failed to send text message.", error)
            return null
        }
    }

    async uploadMedia(businessToken: string, phoneNumberId: string, mediaType: string, mediaUrl: string): Promise<string|null> {
        try {

            this.logger.debug("Uploading file url: ", {mediaUrl})
            this.logger.debug("Uploading file type: ", {mediaType})

            const readStream = await axios.get(mediaUrl, { responseType: 'stream' })

            const formData = new FormData()
            formData.append("messaging_product", "whatsapp")
            formData.append("type", mediaType)
            formData.append("file", readStream.data, { contentType: mediaType })

            const response = await axios.post(
                `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/${phoneNumberId}/media`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${businessToken}`,
                        ...formData.getHeaders()
                    }
                });

            if (!(response.status === 200 || response.status === 201)) {
                this.logger.error("Failed to upload image.", { response })
                return null
            }

            return response.data.id as string;

        } catch (error) {
            this.logger.error("Failed to upload image.", error)
            return null
        }
    }
}