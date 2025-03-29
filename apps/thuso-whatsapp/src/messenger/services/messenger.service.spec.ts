import { Test, TestingModule } from '@nestjs/testing';
import { MessengerService } from './messenger.service';
import { MessengerProcessStateMachineProvider } from '../state-machines/messenger-process.state-machine.provider';
import { LoggingService, mockedLoggingService } from '@lib/logging';

describe('MessengerService', () => {
  let service: MessengerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessengerService,
        {
          provide: MessengerProcessStateMachineProvider,
          useValue: {}
        },
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        }
      ],
    }).compile();

    service = module.get<MessengerService>(MessengerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
