import { LoggingService } from "@lib/logging"
import { ApiAuthGuard } from "@lib/thuso-common"
import { Controller, Get, Param, UseGuards } from "@nestjs/common"
import { Logger } from "winston"
import { AccountsApiService } from "../services/accounts.api.service"

@UseGuards(ApiAuthGuard)
@Controller('api/accounts')
export class AccountsApiController {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly accountsApiService: AccountsApiService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "businesses",
            file: "businesses.api.controller"
        })

        this.logger.info("Businesses API Controller initialized")
    }

    @Get(":accountId")
    getAccountInfo (
        @Param('accountId') accountId: string
    ) {
        return this.accountsApiService.getAccountInfo(accountId)
    }
}