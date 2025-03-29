import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { AuthService } from '../auth/auth.service';
import { AccountsService } from '../accounts/services/accounts.service';
import { ConfigService } from '@nestjs/config';
import { DocumentsService } from './documents.service';
import { JwtService } from '@nestjs/jwt';

describe('DocumentsController', () => {
  let controller: DocumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: {}
        },
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        },
        {
          provide: AuthService,
          useValue: {}
        },
        {
          provide: JwtService,
          useValue: {}
        },
        {
          provide: AccountsService,
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

    controller = module.get<DocumentsController>(DocumentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
