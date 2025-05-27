import { LoggingService } from "@lib/logging"
import { ApiAuthGuard } from "@lib/thuso-common"
import { Controller, Get, Param, UseGuards } from "@nestjs/common"
import { Logger } from "winston"
import { AccountsApiService } from "../services/accounts.api.service"

/*
 *  AccountsApiController is a controller that handles API requests related to accounts.
 *  It provides an endpoint to retrieve account information by account ID.
 */

@UseGuards(ApiAuthGuard)
@Controller('api/accounts')
export class AccountsApiController {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly accountsApiService: AccountsApiService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "accounts",
            file: "accounts.api.controller"
        })

        this.logger.info("Businesses API Controller initialized")
    }


    /*
    *  This method provides a route handler for other to get account information via REST API.
    */
    @Get(":accountId")
    getAccountInfo (
        @Param('accountId') accountId: string
    ) {
        return this.accountsApiService.getAccountInfo(accountId)
    }
}