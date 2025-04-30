import { LoggingService } from "@lib/logging";
import { ApiAuthGuard } from "@lib/thuso-common";
import { Controller, UseGuards } from "@nestjs/common";
import { Logger } from "winston";
import { DocumentsService } from "./documents.service";

@UseGuards(ApiAuthGuard)
@Controller()
export class DocumentsApiController {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly documentsService: DocumentsService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "documents",
            file: "documents.api.controller"
        })

        this.logger.info("Initialised documents api controller")
    }
}