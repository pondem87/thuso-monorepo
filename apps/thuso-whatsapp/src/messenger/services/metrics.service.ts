import { LoggingService } from "@lib/logging"
import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Logger } from "winston"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { DailyMetrics } from "../entities/daily-metrics.entity"
import { RunningMetrics } from "../entities/running-metrics.entity"
import { Conversation } from "../entities/conversation.entity"
import { MessageBody } from "@lib/thuso-common"
import { SentMessage } from "../entities/sent-message.entity"
import { WhatsAppBusinessService } from "./whatsapp-business.service"

@Injectable()
export class MetricsService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService,
        @InjectRepository(DailyMetrics)
        private readonly dailyMetricsRepo: Repository<DailyMetrics>,
        @InjectRepository(RunningMetrics)
        private readonly runningMetricsRepo: Repository<RunningMetrics>,
        @InjectRepository(Conversation)
        private readonly conversationRepo: Repository<Conversation>,
        @InjectRepository(SentMessage)
        private readonly sentMessageRepo: Repository<SentMessage>,
        private readonly whatsAppBusinessService: WhatsAppBusinessService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "messenger",
            file: "metrics.service"
        })

        this.logger.info("Initialised MetricsService")
    }

    async createConversation(wabaId: string, phoneNumberId: string, userId: string, type: string): Promise<Conversation> {
        try {
            const account = await this.whatsAppBusinessService.getAccountByWabaId(wabaId)

            let conversationCount = 0

            for (const waba of account.wabas) {
                const rms = await this.getAllRunningMetrics(waba.wabaId)
                if (rms) {
                    for (const rm of rms) {
                        conversationCount += rm.totalConversations
                    }
                }
            }

            // check conversation limits
            if (conversationCount >= account.maxAllowedDailyConversations) {
                // limit reachead
                this.logger.warn("Maximum allowed conversations for account reached", { accountId: account.id })
                return null
            }

            const conversation = await this.conversationRepo.save(
                this.conversationRepo.create({
                    userId,
                    phoneNumberId,
                    type
                })
            )

            // update rm
            const rm = await this.getRunningMetrics(wabaId, phoneNumberId)
            rm.totalConversations += 1
            await this.runningMetricsRepo.save(rm)

            return conversation
        } catch (error) {
            this.logger.warn("Failed to create new conversation.", error)
            return null
        }
    }

    async findValidConversation(phoneNumberId: string, userId: string, conversationType: string): Promise<Conversation | null> {
        try {
            return await this.conversationRepo.findOne({
                where: { userId, phoneNumberId, type: conversationType }
            })
        } catch (error) {
            this.logger.warn("Failed to find valid conversation.", error)
            return null
        }
    }

    async getRunningMetrics(wabaId: string, phoneNumberId: string): Promise<RunningMetrics> {
        try {
            let runningMetrics = await this.runningMetricsRepo.findOne({ where: { wabaId, phoneNumberId } })
            if (!runningMetrics) {
                runningMetrics = await this.runningMetricsRepo.save(
                    this.runningMetricsRepo.create({
                        wabaId,
                        phoneNumberId
                    })
                )
            }
            return runningMetrics
        } catch (error) {
            this.logger.warn("Failed to get or create running metrics.", { wabaId, error })
            return null
        }
    }

    async getAllRunningMetrics(wabaId: string): Promise<RunningMetrics[]> {
        try {
            return await this.runningMetricsRepo.find({ where: { wabaId } })
        } catch (error) {
            this.logger.warn("Failed to get or create running metrics.", { wabaId, error })
            return null
        }
    }

    async createSentMessage(wamid: string, messageBody: MessageBody, conversation: Conversation, campaignId: string|null): Promise<void> {
        try {
            await this.sentMessageRepo.save(
                this.sentMessageRepo.create({
                    wamid,
                    messageBody,
                    conversation,
                    status: "sent", // Initial status is set to 'sent'
                    campaignId
                })
            )
        } catch (error) {
            this.logger.error("Failed to save sent message.", error)
        }
    }
}