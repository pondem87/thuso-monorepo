import { LoggingService } from "@lib/logging";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Logger } from "winston";
import { Account } from "../entities/account.entity";
import { SendEmailQueueMessage } from "@lib/thuso-common";
import { ConfigService } from "@nestjs/config";
import { RmqContext } from "@nestjs/microservices";

@Injectable()
export class AccountsApiService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "accounts",
            file: "accounts.api.service"
        })

        this.logger.info("Accounts API Service initialized")
    }

    getAccountInfo(accountId: string) {
        try {
            return this.accountRepository.findOne({
                where: { id: accountId }
            })
        } catch (error) {
            this.logger.error("Error while getting account information by id", { accountId, error })
            throw new HttpException("Failed to get account info", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async sendEmail(data: SendEmailQueueMessage, ctx: RmqContext): Promise<boolean> {
        // const channel = ctx.getChannelRef()
        // const origMsg = ctx.getMessage()
        this.logger.debug("Sending email:", {data})

        try {
            const sendEmailResponse = await fetch(
                `${this.configService.get<string>("SEND_MAIL_SERVERLESS_URL")}`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${this.configService.get<string>("SEND_MAIL_SERVERLESS_AUTH_TOKEN")}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: data.email,
                        subject: data.subject,
                        text: data.text,
                        html: data.html
                    })
                }
            )

            if (sendEmailResponse.ok) {
                // channel.ack(origMsg)
                this.logger.info("Email sent", { email: data.email, subject: data.subject, response: await sendEmailResponse.text() })
                return true
            }

            this.logger.warn("Sending email failed", { email: data.email, subject: data.subject, response: await sendEmailResponse.text() })
            // channel.nack(origMsg)
            return false

        } catch (error) {
            this.logger.warn("Sending email failed", { email: data.email, subject: data.subject, error })
            // channel.nack(origMsg)
            return false
        }
    }
}