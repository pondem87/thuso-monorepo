import { Test, TestingModule } from '@nestjs/testing';
import { MessageProcessorService } from './message-processor.service';

describe('MessageProcessorService', () => {
  let service: MessageProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageProcessorService],
    }).compile();

    service = module.get<MessageProcessorService>(MessageProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
