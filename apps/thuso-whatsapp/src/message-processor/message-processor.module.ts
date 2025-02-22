import { Module } from '@nestjs/common';
import { MessageProcessorController } from './message-processor.controller';
import { MessageProcessorService } from './services/message-processor.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggingModule, LoggingService } from '@lib/logging';

@Module({
  imports: [ConfigModule, LoggingModule],
  controllers: [MessageProcessorController],
  providers: [MessageProcessorService, ConfigService, LoggingService]
})
export class MessageProcessorModule {}
