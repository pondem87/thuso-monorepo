import { LoggingService } from "@lib/logging"
import { SendEmailEventPattern, SendEmailQueueMessage } from "@lib/thuso-common"
import { Controller } from "@nestjs/common"
import { Logger } from "winston"
import { AccountsApiService } from "../services/accounts.api.service"
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices"


@Controller('rmq/accounts')
export class AccountsRmqController {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly accountsApiService: AccountsApiService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "accounts",
            file: "accounts.rmq.controller"
        })

        this.logger.info("Businesses API Controller initialized")
    }

    @MessagePattern(SendEmailEventPattern)
    sendEmail(
        @Payload() data: SendEmailQueueMessage,
        @Ctx() ctx: RmqContext
    ) {
        return this.accountsApiService.sendEmail(data, ctx)
    }
}