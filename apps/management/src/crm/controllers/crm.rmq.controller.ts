import { LoggingService } from "@lib/logging"
import { Controller } from "@nestjs/common"
import { Logger } from "winston"
import { CrmService } from "../services/crm.service"
import { EventPattern, Payload } from "@nestjs/microservices"
import { NewTopicLLMEventPattern, NewTopicLLMEventPayload, RegisterCustomerEventPayload, RegisterCustomerToCRMEventPattern } from "@lib/thuso-common"

@Controller()
export class CrmRmqController {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly crmService: CrmService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "crm",
            file: "crm.rmq.controller"
        })

        this.logger.info("Initialised CRM Rmq controller")
    }

    @EventPattern(RegisterCustomerToCRMEventPattern)
    processCustomerRegistration(
        @Payload() data: RegisterCustomerEventPayload
    ) {
        return this.crmService.processRegisterCustomer(data)
    }

    @EventPattern(NewTopicLLMEventPattern)
    processNewChatTopic(
        @Payload() data: NewTopicLLMEventPayload
    ) {
        return this.crmService.processNewChatTopic(data)
    }
}