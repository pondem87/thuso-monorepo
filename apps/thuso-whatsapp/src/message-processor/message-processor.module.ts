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

@Module({
  imports: [TypeOrmModule.forFeature([MessageProcessorAccountData, PersistedInteractiveState]), ConfigModule, LoggingModule, ThusoCommonModule],
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
    {
      provide: LlmRmqClient,
      useFactory: (configService: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [`${configService.get<string>("THUSO_RMQ_URL")}:${configService.get<string>("THUSO_RMQ_PORT")}`],
            queue: configService.get<string>("AI_RMQ_QUEUENAME"),
            queueOptions: {
              durable: configService.get<string>("THUSO_RMQ_IS_DURABLE") === "true" ? true : false
            },
          },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: WhatsappRmqClient,
      useFactory: (configService: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [`${configService.get<string>("THUSO_RMQ_URL")}:${configService.get<string>("THUSO_RMQ_PORT")}`],
            queue: configService.get<string>("WHATSAPP_RMQ_QUEUENAME"),
            queueOptions: {
              durable: configService.get<string>("THUSO_RMQ_IS_DURABLE") === "true"
            },
          },
        })
      },
      inject: [ConfigService]
    }
  ]
})
export class MessageProcessorModule { }
