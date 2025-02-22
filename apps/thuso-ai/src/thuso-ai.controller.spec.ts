import { Test, TestingModule } from '@nestjs/testing';
import { ThusoAiController } from './thuso-ai.controller';
import { ThusoAiService } from './thuso-ai.service';

describe('ThusoAiController', () => {
  let thusoAiController: ThusoAiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ThusoAiController],
      providers: [ThusoAiService],
    }).compile();

    thusoAiController = app.get<ThusoAiController>(ThusoAiController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(thusoAiController.getHello()).toBe('Hello World!');
    });
  });
});
