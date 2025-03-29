import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ThusoAiModule } from '../../src/thuso-ai.module';
import { CreateEmbeddingDto } from '../../src/embedding/dto/create-embedding.dto';
import { EmbeddingController } from '../../src/embedding/embedding.controller';
import { EmbeddingService } from '../../src/embedding/embedding.service';
import { LONG_TEST_TIMEOUT } from '@lib/thuso-common';

describe('ThusoAiController (e2e)', () => {
    let app: INestApplication;
    let embeddingController: EmbeddingController
    let embeddingService: EmbeddingService

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ThusoAiModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        embeddingController = moduleFixture.get<EmbeddingController>(EmbeddingController)
        embeddingService = moduleFixture.get<EmbeddingService>(EmbeddingService)
    }, LONG_TEST_TIMEOUT);

    it('create retrieve and delete embeddings', async () => {
        const dto: CreateEmbeddingDto = {
            documentId: "dfc114db-b440-4c6f-92ef-7ef44f683fe3",
            s3key: "document/6183cc2f-7259-451b-a2c6-97b963131471/UXJMALsfsQzYxGb.docx",
            mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            businessProfileId: "BUSINESS_PROFILE_ID",
            accountId: "ACCOUNT_ID"
        }

        await embeddingController.embedDocument(dto)

        // now get similarity
        const docs = await embeddingService.searchEmbeddings("", {
            businessProfileId: dto.businessProfileId,
            accountId: dto.accountId
        })

        expect(docs.length > 0).toBe(true)
        expect(docs[0].metadata.businessProfileId).toBe(dto.businessProfileId)

        // now remove those embeddings
        await embeddingController.deleteEmbedding({
            businessProfileId: dto.businessProfileId,
            accountId: dto.accountId
        })

        // get those embeddings again
        const moreDocs = await embeddingService.searchEmbeddings("", {
            businessProfileId: dto.businessProfileId,
            accountId: dto.accountId
        })

        expect(moreDocs.length === 0).toBe(true)
    }, LONG_TEST_TIMEOUT);
});
