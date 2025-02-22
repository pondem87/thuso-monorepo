import { Controller, Get } from '@nestjs/common';
import { ThusoWhatsappService } from './thuso-whatsapp.service';

@Controller()
export class ThusoWhatsappController {
  constructor(private readonly thusoWhatsappService: ThusoWhatsappService) {}

  @Get()
  getHealth(): string {
    return this.thusoWhatsappService.getHealth();
  }
}
