import { Test, TestingModule } from '@nestjs/testing';
import { ChatAgentService } from './chat-agent.service';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { LLMProcessStateMachineProvider } from './state-machines/llm-process.state-machine.provider';

describe('ChatAgentService', () => {
  let service: ChatAgentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatAgentService,
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        },
        {
          provide: LLMProcessStateMachineProvider,
          useValue: {}
        }
      ],
    }).compile();

    service = module.get<ChatAgentService>(ChatAgentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
