import { Test, TestingModule } from '@nestjs/testing';
import { BusinessesService } from './businesses.service';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WhatsAppNumber } from '../entities/whatsapp-number';
import { BusinessProfile } from '../entities/business-profile.entity';
import { Account } from '../../accounts/entities/account.entity';
import { WhatsAppBusiness } from '../entities/whatsapp-business.entity';
import { ConfigService } from '@nestjs/config';

describe('BusinessesService', () => {
  let service: BusinessesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessesService,
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        },
        {
          provide: getRepositoryToken(WhatsAppBusiness),
          useValue: {}
        },
        {
          provide: getRepositoryToken(Account),
          useValue: {}
        },
        {
          provide: getRepositoryToken(WhatsAppNumber),
          useValue: {}
        },
        {
          provide: getRepositoryToken(BusinessProfile),
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

    service = module.get<BusinessesService>(BusinessesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
