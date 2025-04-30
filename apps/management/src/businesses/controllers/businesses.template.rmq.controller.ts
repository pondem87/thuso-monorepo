import { LoggingService } from "@lib/logging";
import { TemplateQualityEventPattern, TemplateQualityEventPayload, TemplateUpdateEventPattern, TemplateUpdateEventPayload } from "@lib/thuso-common";
import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { Logger } from "winston";
import { WhatsAppTemplateService } from "../services/businesses.templates.service";

@Controller()
export class WhatsAppTemplateRmqController {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly whatsAppTemplateService: WhatsAppTemplateService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "businesses",
            file: "businesses.template.rmq.controller"
        })

        this.logger.info("Initialised WhatsApp template Rmq controller")
    }

    @EventPattern(TemplateUpdateEventPattern)
    processTemplateStatusUpdate(
        @Payload() data: TemplateUpdateEventPayload
    ) {
        return this.whatsAppTemplateService.processTemplateUpdate(data)
    }

    @EventPattern(TemplateQualityEventPattern)
    processTemplateQualityUpdate(
        @Payload() data: TemplateQualityEventPayload
    ) {
        return this.whatsAppTemplateService.processTemplateQualityUpdate(data)
    }
}