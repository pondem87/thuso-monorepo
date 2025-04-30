import { Test, TestingModule } from '@nestjs/testing';
import { ThusoClientProxiesService } from './thuso-client-proxies.service';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { LlmRmqClient, MgntRmqClient, WhatsappRmqClient } from '@lib/thuso-common';

describe('ThusoClientProxiesService', () => {
  let service: ThusoClientProxiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThusoClientProxiesService,
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        },
        {
          provide: MgntRmqClient,
          useValue: {}
        },
        {
          provide: LlmRmqClient,
          useValue: {}
        },
        {
          provide: WhatsappRmqClient,
          useValue: {}
        }
      ],
    }).compile();

    service = module.get<ThusoClientProxiesService>(ThusoClientProxiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
