import { LoggingService } from '@lib/logging';
import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { Logger } from 'winston';
import { EmbeddingService } from './embedding.service';
import { CreateEmbeddingDto } from './dto/create-embedding.dto';
import { ApiAuthGuard } from '@lib/thuso-common/api-auth-guard';

@UseGuards(ApiAuthGuard)
@Controller('ai/embedding')
export class EmbeddingController {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly embeddingService: EmbeddingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "embedding",
            file: "embedding.controller"
        })

        this.logger.info("Embedding Controller initailised")
    }

    @Post()
    embedDocument(
        @Body() dto: CreateEmbeddingDto
    ) {
        return this.embeddingService.embedDocument(dto)
    }

    @Delete()
    deleteEmbedding(
        @Body() dto: Partial<CreateEmbeddingDto>
    ) {
        return this.embeddingService.deleteEmbedding(dto)
    }
}
