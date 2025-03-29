import { Test, TestingModule } from '@nestjs/testing';
import { ManagementController } from './management.controller';
import { ManagementService } from './management.service';

describe('ManagementController', () => {
  let managementController: ManagementController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ManagementController],
      providers: [ManagementService],
    }).compile();

    managementController = app.get<ManagementController>(ManagementController);
  });

  describe('root', () => {
    it('should return "Server Active!"', () => {
      expect(managementController.getHealth()).toBe('Server Active!');
    });
  });
});
