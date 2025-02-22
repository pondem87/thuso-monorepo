import { LoggingService } from "@lib/logging";
import { Controller, Get, Param, Response } from "@nestjs/common";
import { DocumentsService } from "./documents.service";
import { Logger } from "winston";
import { Response as Res } from 'express';

@Controller("/management/documents")
export class DocumentDownloadController {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly documentsService: DocumentsService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "documents",
            file: "documents.controller"
        })

        this.logger.info("Documents Controller initialized")
    }

    @Get("download/:type/:subfolder/:file")
    downloadDocument(
        @Param('type') type: string,
        @Param('subfolder') subfolder: string,
        @Param('file') file: string,
        @Response() res: Res
    ) {
        return this.documentsService.downloadDocument(`${type}/${subfolder}/${file}`, res)
    }
}