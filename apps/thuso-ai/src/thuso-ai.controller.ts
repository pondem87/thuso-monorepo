import { Controller, Get } from '@nestjs/common';
import { ThusoAiService } from './thuso-ai.service';

@Controller()
export class ThusoAiController {
  constructor(private readonly thusoAiService: ThusoAiService) {}

  @Get()
  getHealth(): string {
    return this.thusoAiService.getHealth();
  }
}
