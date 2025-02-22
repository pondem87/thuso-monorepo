import { Test, TestingModule } from '@nestjs/testing';
import { ThusoSubscriptionController } from './thuso-subscription.controller';
import { ThusoSubscriptionService } from './thuso-subscription.service';

describe('ThusoSubscriptionController', () => {
  let thusoSubscriptionController: ThusoSubscriptionController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ThusoSubscriptionController],
      providers: [ThusoSubscriptionService],
    }).compile();

    thusoSubscriptionController = app.get<ThusoSubscriptionController>(ThusoSubscriptionController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(thusoSubscriptionController.getHello()).toBe('Hello World!');
    });
  });
});
