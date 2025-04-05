import { LoggingService } from "@lib/logging"
import { ApiAuthGuard } from "@lib/thuso-common"
import { UseGuards, Controller, Get, Param } from "@nestjs/common"
import { Logger } from "winston"
import { BusinessesApiService } from "../services/businesses.api.service"

@UseGuards(ApiAuthGuard)
@Controller('api/businesses')
export class BusinessesApiController {
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

    @Get(":wabaId")
    getBusinessInfoByWabaId (
        @Param('wabaId') wabaId: string
    ) {
        return this.businessesApiService.getBusinessInfoByWabaId(wabaId)
    }

    @Get(":wabaId/profile")
    getBusinessProfileByWabaId (
        @Param('wabaId') wabaId: string
    ) {
        return this.businessesApiService.getBusinessProfileByWabaId(wabaId)
    }
}