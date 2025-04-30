import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappService } from './whatsapp.service';
import { WhatsappRmqClient } from '@lib/thuso-common';
import { ConfigService } from '@nestjs/config';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { ThusoClientProxiesService } from '@lib/thuso-client-proxies';

describe('WhatsappService', () => {
  let service: WhatsappService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappService,
        {
          provide: WhatsappRmqClient,
          useValue: {}
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((input) => input)
          }
        },
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        },
        {
          provide: ThusoClientProxiesService,
          useValue: {}
        }
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
