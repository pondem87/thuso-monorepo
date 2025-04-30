import { Module } from '@nestjs/common';
import { MessageProcessorController } from './controllers/message-processor.controller';
import { MessageProcessorService } from './services/message-processor.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggingModule, LoggingService } from '@lib/logging';
import { LlmRmqClient, ThusoCommonModule, WhatsappRmqClient } from '@lib/thuso-common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersistedInteractiveState } from './entities/persisted-interactive-state.entity';
import { InteractiveStateMachineService } from './state-machines/interactive.state-machine.service';
import { InteractiveStateMachineProvider } from './state-machines/interactive.state-machine.provider';
import { AccountDataService } from './services/account-data.service';
import { LLMQueueService } from './services/llm-queue.service';
import { HomeStateService } from './machine-states/home-state.service';
import { ProductsStateService } from './machine-states/products-state.service';
import { MessageProcessingStateMachineProvider } from './state-machines/message-processing.state-machine.provider';
import { MessageProcessorAccountData } from './entities/account-data.entity';
import { ThusoClientProxiesModule, ThusoClientProxiesService } from '@lib/thuso-client-proxies';

@Module({
  imports: [TypeOrmModule.forFeature([MessageProcessorAccountData, PersistedInteractiveState]), ConfigModule, LoggingModule, ThusoCommonModule, ThusoClientProxiesModule],
  controllers: [MessageProcessorController],
  providers: [
    MessageProcessorService,
    ConfigService,
    LoggingService,
    InteractiveStateMachineService,
    InteractiveStateMachineProvider,
    AccountDataService,
    LLMQueueService,
    HomeStateService,
    ProductsStateService,
    MessageProcessingStateMachineProvider,
    ThusoClientProxiesService
  ]
})
export class MessageProcessorModule { }
