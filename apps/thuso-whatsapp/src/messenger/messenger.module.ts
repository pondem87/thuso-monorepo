import { Module } from '@nestjs/common';
import { MessengerController } from './controllers/messenger.controller';
import { MessengerService } from './services/messenger.service';

@Module({
  controllers: [MessengerController],
  providers: [MessengerService]
})
export class MessengerModule {}
