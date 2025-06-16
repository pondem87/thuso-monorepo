import { LoggingService } from "@lib/logging";
import { Controller } from "@nestjs/common";
import { BusinessesRmqService } from "../services/businesses.rmq.service";
import { Logger } from "winston";

/*
 * This controller listens for events related to businesses and processes them.
*/
@Controller()
export class BusinessesRmqController {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly businessesRmqService: BusinessesRmqService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "businesses",
            file: "businesses.rmq.controller"
        })
    }
}