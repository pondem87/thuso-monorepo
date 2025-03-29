import { Test, TestingModule } from '@nestjs/testing';
import { MessengerController } from './messenger.controller';
import { MessengerService } from '../services/messenger.service';
import { LoggingService, mockedLoggingService } from '@lib/logging';

describe('MessengerController', () => {
  let controller: MessengerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessengerController],
      providers: [
        {
          provide: MessengerService,
          useValue: {}
        },
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        }
      ]
    }).compile();

    controller = module.get<MessengerController>(MessengerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
