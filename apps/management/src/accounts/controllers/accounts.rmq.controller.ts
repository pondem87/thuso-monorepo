import { LoggingService } from "@lib/logging"
import { AccountDataUpdatePayload, AccountUpdateAccountsPattern, SendEmailEventPattern, SendEmailQueueMessage, UserDataUpdatePayload, UserUpdateAccountsPattern } from "@lib/thuso-common"
import { Controller } from "@nestjs/common"
import { Logger } from "winston"
import { AccountsApiService } from "../services/accounts.api.service"
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices"
import { AccountsRmqService } from "../services/accounts.rmq.service"

/*
 * This controller handles RMQ messages related to accounts.
 * Messages originate from this management service or other services
*/


@Controller('rmq/accounts')
export class AccountsRmqController {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly accountsApiService: AccountsApiService,
        private readonly accountsRmqService: AccountsRmqService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "accounts",
            file: "accounts.rmq.controller"
        })

        this.logger.info("Businesses API Controller initialized")
    }

    /*
     * This handler processes the SendEmailQueueMessage.
     * Handles sending emails via the AccountsApiService.
     * Contains: { email: string, subject: string, text: string, html: string }
    */
    @MessagePattern(SendEmailEventPattern)
    sendEmail(
        @Payload() data: SendEmailQueueMessage,
        @Ctx() ctx: RmqContext
    ) {
        return this.accountsApiService.sendEmail(data, ctx)
    }

    /*
     * This handler processes account updates.
     * Called when there is an update to an account.
    */
    @MessagePattern(AccountUpdateAccountsPattern)
    processAccountUpdate(
        @Payload() data: AccountDataUpdatePayload
    ) {
        return this.accountsRmqService.processAccountUpdate(data)
    }

    /*
     * This handler processes user updates.
     * Called when there is an update to a user.
    */
    @MessagePattern(UserUpdateAccountsPattern)
    processUserUpdate(
        @Payload() data: UserDataUpdatePayload
    ) {
        return this.accountsRmqService.processUserUpdate(data)
    }
}