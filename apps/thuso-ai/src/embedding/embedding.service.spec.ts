import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingService } from './embedding.service';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { PostgresVectorStore } from './vector-store.provider';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CreateEmbeddingDto } from './dto/create-embedding.dto';
import { LONG_TEST_TIMEOUT } from '@lib/thuso-common';

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        EmbeddingService,
        PostgresVectorStore,
        ConfigService,
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        }
      ],
    }).compile();

    service = module.get<EmbeddingService>(EmbeddingService);
  }, LONG_TEST_TIMEOUT);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create, retrieve and delete embeddings', async () => {
    const dto: CreateEmbeddingDto = {
      documentId: "dfc114db-b440-4c6f-92ef-7ef44f683fe3",
      s3key: "document/6183cc2f-7259-451b-a2c6-97b963131471/UXJMALsfsQzYxGb.docx",
      mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      businessProfileId: "BUSINESS_PROFILE_ID",
      accountId: "ACCOUNT_ID"
    }

    await service.embedDocument(dto)

    // now get similarity
    const docs = await service.searchEmbeddings("", {
      businessProfileId: dto.businessProfileId,
      accountId: dto.accountId
    })

    expect(docs.length > 0).toBe(true)
    expect(docs[0].metadata.businessProfileId).toBe(dto.businessProfileId)

    // now remove those embeddings
    await service.deleteEmbedding({
      businessProfileId: dto.businessProfileId,
      accountId: dto.accountId
    })

    // get those embeddings again
    const moreDocs = await service.searchEmbeddings("", {
      businessProfileId: dto.businessProfileId,
      accountId: dto.accountId
    })

    expect(moreDocs.length === 0).toBe(true)

  }, LONG_TEST_TIMEOUT)

});
