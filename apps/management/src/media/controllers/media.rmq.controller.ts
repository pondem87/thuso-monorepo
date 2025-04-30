import { LoggingService } from "@lib/logging";
import { Controller } from "@nestjs/common";
import { Logger } from "winston";
import { MediaService } from "../services/media.service";

@Controller()
export class MediaRmqController {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly mediaService: MediaService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "media",
            file: "media.rmq.controller"
        })
    }

}