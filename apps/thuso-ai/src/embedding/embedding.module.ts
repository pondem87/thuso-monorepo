import { Module } from '@nestjs/common';
import { EmbeddingController } from './embedding.controller';
import { EmbeddingService } from './embedding.service';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { ApiAuthGuard } from '@lib/thuso-common/api-auth-guard';
import { ThusoCommonModule } from '@lib/thuso-common';

@Module({
  imports: [ThusoCommonModule],
  controllers: [EmbeddingController],
  providers: [EmbeddingService, PGVectorStore, ApiAuthGuard]
})
export class EmbeddingModule {}
