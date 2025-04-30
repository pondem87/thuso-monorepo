import { Module } from '@nestjs/common';
import { MessengerController } from './controllers/messenger.controller';
import { MessengerService } from './services/messenger.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessengerAccount } from './entities/account.entity';
import { Conversation } from './entities/conversation.entity';
import { DailyMetrics } from './entities/daily-metrics.entity';
import { RunningMetrics } from './entities/running-metrics.entity';
import { SentMessage } from './entities/sent-message.entity';
import { MessengerWhatsAppBusiness } from './entities/whatsapp-business.entity';
import { ConfigModule } from '@nestjs/config';
import { LoggingModule } from '@lib/logging';
import { MetricsService } from './services/metrics.service';
import { WhatsAppBusinessService } from './services/whatsapp-business.service';
import { MessengerProcessStateMachineProvider } from './state-machines/messenger-process.state-machine.provider';
import { ThusoCommonModule } from '@lib/thuso-common';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessengerAccount, Conversation, DailyMetrics, RunningMetrics, SentMessage, MessengerWhatsAppBusiness]),
    ConfigModule,
    LoggingModule,
    ThusoCommonModule
  ],
  controllers: [MessengerController],
  providers: [MessengerService, MetricsService, WhatsAppBusinessService, MessengerProcessStateMachineProvider]
})
export class MessengerModule {}
