import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { LoggingService, mockedLoggingService } from '@lib/logging';

describe('WhatsappController', () => {
  let controller: WhatsappController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        WhatsappController,
      ],
      providers: [
        {
          provide: WhatsappService,
          useValue: {}
        },
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        }
      ]
    }).compile();

    controller = module.get<WhatsappController>(WhatsappController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
