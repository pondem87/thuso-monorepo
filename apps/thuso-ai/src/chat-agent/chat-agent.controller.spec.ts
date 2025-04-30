import { Test, TestingModule } from '@nestjs/testing';
import { ChatAgentController } from './chat-agent.controller';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { ChatAgentService } from './chat-agent.service';
import { BusinessProfileService } from './services/business-profile.service';
import { ChatMessageHistoryService } from './chat-message-history/chat-message-history.service';

describe('ChatAgentController', () => {
  let controller: ChatAgentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatAgentController],
      providers: [
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        },
        {
          provide: ChatAgentService,
          useValue: {}
        },
        {
          provide: BusinessProfileService,
          useValue: {}
        },
        {
          provide: ChatMessageHistoryService,
          useValue: {}
        }
      ]
    }).compile();

    controller = module.get<ChatAgentController>(ChatAgentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
