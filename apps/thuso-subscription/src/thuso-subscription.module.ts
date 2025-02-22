import { Module } from '@nestjs/common';
import { ThusoSubscriptionController } from './thuso-subscription.controller';
import { ThusoSubscriptionService } from './thuso-subscription.service';

@Module({
  imports: [],
  controllers: [ThusoSubscriptionController],
  providers: [ThusoSubscriptionService],
})
export class ThusoSubscriptionModule {}
