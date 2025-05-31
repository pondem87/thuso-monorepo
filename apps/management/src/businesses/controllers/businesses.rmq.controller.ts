import { LoggingService } from "@lib/logging";
import { Controller } from "@nestjs/common";
import { BusinessesRmqService } from "../services/businesses.rmq.service";
import { Logger } from "winston";
import { EventPattern, Payload } from "@nestjs/microservices";
import { NewCustomerBusinessEventPattern, NewCustomerBusinessEventPayload } from "@lib/thuso-common";

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

    /**
     * Called when a new customer is added to the CRM module
     * @param payload - The payload containing new customer event data.
     */
    @EventPattern(NewCustomerBusinessEventPattern)
    processNewCustomer(
        @Payload() payload: NewCustomerBusinessEventPayload
    ) {
        this.logger.info("Received payload: NewCustomerBusinessEvent", { payload })
        return this.businessesRmqService.processNewCustomer(payload)
    }
}