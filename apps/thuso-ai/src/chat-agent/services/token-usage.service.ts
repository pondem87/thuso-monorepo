import { LoggingService } from "@lib/logging";
import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Logger } from "winston";
import { MonthlyTokenUsage } from "../entities/monthly-token-usage.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { LlmTokenUsage } from "../utility/llm-callback-handler";
import { isDateLessThanDaysOld } from "@lib/thuso-common";

@Injectable()
export class TokenUsageService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @InjectRepository(MonthlyTokenUsage)
        private readonly tokenUsageRepo: Repository<MonthlyTokenUsage>
    ) {
        this.logger = this.loggingService.getLogger({
            file: "token-usage.service",
            module: "chat-agent"
        })

        this.logger.info("Initialised TokenUsage service")
    }

    async addUsedTokens(wabaId: string, { inputTokens, outputTokens }: LlmTokenUsage): Promise<void> {
        try {
            this.logger.debug("adding used tokens", { wabaId, inputTokens, outputTokens })
            const monthlyUsage = await this.tokenUsageRepo.findOne({ where: { wabaId }, order: { createdAt: "DESC" }})
            if (!monthlyUsage || !isDateLessThanDaysOld(monthlyUsage.createdAt, 30)) {
                await this.tokenUsageRepo.save(
                    this.tokenUsageRepo.create({
                        wabaId,
                        inputTokens,
                        outputTokens
                    })
                )
                return
            }

            monthlyUsage.inputTokens += inputTokens
            monthlyUsage.outputTokens += outputTokens
            await this.tokenUsageRepo.save(monthlyUsage)
        } catch (error) {
            this.logger.warn("Failed to save token usage", { error, wabaId })
        }
    }
}