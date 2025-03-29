import { Test, TestingModule } from '@nestjs/testing';
import { MessageProcessorController } from './message-processor.controller';
import { MessageProcessorService } from '../services/message-processor.service';
import { LoggingService, mockedLoggingService } from '@lib/logging';

describe('MessageProcessorController', () => {
  let controller: MessageProcessorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        MessageProcessorController,
      ],
      providers: [
        {
          provide: MessageProcessorService,
          useValue: {}
        },
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        }
      ]
    }).compile();

    controller = module.get<MessageProcessorController>(MessageProcessorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
