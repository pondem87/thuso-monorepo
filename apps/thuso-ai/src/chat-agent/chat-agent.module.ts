import { Module } from '@nestjs/common';
import { ChatAgentController } from './chat-agent.controller';
import { ChatAgentService } from './chat-agent.service';
import { LoggingModule } from '@lib/logging';
import { EmbeddingModule } from '../embedding/embedding.module';
import { WhatsappRmqClient } from '@lib/thuso-common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessProfile } from './entities/business-profile.entity';
import { ChatHistory } from './entities/chat-history.entity';
import { ChatTopic } from './entities/chat-topic.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { LLMProcessStateMachineProvider } from './state-machines/llm-process.state-machine.provider';
import { LangGraphAgentProvider } from './agents/langgraph-agent.provider';
import { LLMFuncToolsProvider } from './agents/llm-func-tools.provider';
import { ChatMessageHistoryProvider } from './chat-message-history/chat-message-history-provider';
import { ChatMessageHistoryService } from './chat-message-history/chat-message-history.service';
import { BusinessProfileService } from './services/business-profile.service';

@Module({
  imports: [LoggingModule, EmbeddingModule, TypeOrmModule.forFeature([BusinessProfile, ChatHistory, ChatTopic, ChatMessage])],
  controllers: [ChatAgentController],
  providers: [
    ChatAgentService,
    LLMProcessStateMachineProvider,
    LangGraphAgentProvider,
    LLMFuncToolsProvider,
    ChatMessageHistoryProvider,
    ChatMessageHistoryService,
    BusinessProfileService,
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
  ],
  exports: [TypeOrmModule]
})
export class ChatAgentModule { }
