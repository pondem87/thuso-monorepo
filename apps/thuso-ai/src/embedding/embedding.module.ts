import { Module } from '@nestjs/common';
import { EmbeddingController } from './embedding.controller';
import { EmbeddingService } from './embedding.service';
import { ApiAuthGuard } from '@lib/thuso-common';
import { ThusoCommonModule } from '@lib/thuso-common';
import { PostgresVectorStore } from './vector-store.provider';
import { LoggingModule } from '@lib/logging';

@Module({
  imports: [ThusoCommonModule, LoggingModule],
  controllers: [EmbeddingController],
  providers: [EmbeddingService, PostgresVectorStore, ApiAuthGuard],
  exports: [EmbeddingService],
})
export class EmbeddingModule {}
