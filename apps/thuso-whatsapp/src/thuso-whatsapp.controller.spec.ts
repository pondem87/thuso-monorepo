import { Test, TestingModule } from '@nestjs/testing';
import { ThusoWhatsappController } from './thuso-whatsapp.controller';
import { ThusoWhatsappService } from './thuso-whatsapp.service';

describe('ThusoWhatsappController', () => {
  let thusoWhatsappController: ThusoWhatsappController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ThusoWhatsappController],
      providers: [ThusoWhatsappService],
    }).compile();

    thusoWhatsappController = app.get<ThusoWhatsappController>(ThusoWhatsappController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(thusoWhatsappController.getHealth()).toBe('Server Active!');
    });
  });
});
