import { LoggingService } from "@lib/logging"
import { ApiAuthGuard } from "@lib/thuso-common/api-auth-guard"
import { UseGuards, Controller, Get, Param } from "@nestjs/common"
import { Logger } from "winston"
import { BusinessesApiService } from "../services/businesses.api.service"

@UseGuards(ApiAuthGuard)
@Controller('api/businesses')
export class ProductsApiController {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly businessesApiService: BusinessesApiService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "businesses",
            file: "businesses.api.controller"
        })

        this.logger.info("Businesses API Controller initialized")
    }

    @Get("phone-number/:phoneNumberId")
    getBusinessInfoByPhoneNumberId (
        @Param('phoneNumberId') phoneNumberId: string
    ) {
        return this.businessesApiService.getBusinessInfoByPhoneNumberId(phoneNumberId)
    }
}