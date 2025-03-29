import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { ConfigService } from '@nestjs/config';
import { Document } from './entity/document.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('DocumentsService', () => {
  let service: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        },
        {
          provide: getRepositoryToken(Document),
          useValue: {}
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((input) => input)
          }
        }
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
