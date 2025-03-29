import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingController } from './embedding.controller';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from './embedding.service';

describe('EmbeddingController', () => {
  let controller: EmbeddingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmbeddingController],
      providers: [
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        },
        {
          provide: EmbeddingService,
          useValue: {}
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((input) => input)
          }
        }
      ]
    }).compile();

    controller = module.get<EmbeddingController>(EmbeddingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
