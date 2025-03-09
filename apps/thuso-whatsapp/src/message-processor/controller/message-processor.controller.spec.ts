import { Test, TestingModule } from '@nestjs/testing';
import { MessageProcessorController } from './message-processor.controller';

describe('MessageProcessorController', () => {
  let controller: MessageProcessorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageProcessorController],
    }).compile();

    controller = module.get<MessageProcessorController>(MessageProcessorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
