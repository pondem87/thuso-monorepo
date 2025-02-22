import { Controller, Get } from '@nestjs/common';
import { ThusoSubscriptionService } from './thuso-subscription.service';

@Controller()
export class ThusoSubscriptionController {
  constructor(private readonly thusoSubscriptionService: ThusoSubscriptionService) {}

  @Get()
  getHello(): string {
    return this.thusoSubscriptionService.getHello();
  }
}
