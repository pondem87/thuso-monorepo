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
import { ThusoClientProxiesModule, ThusoClientProxiesService } from '@lib/thuso-client-proxies';
import { ChatAgentApiController } from './chat-agent.api.controller';
import { ChatMessageHistoryApiService } from './chat-message-history/chat-message-history.api.service';

@Module({
  imports: [LoggingModule, EmbeddingModule, TypeOrmModule.forFeature([BusinessProfile, ChatHistory, ChatTopic, ChatMessage]), ThusoClientProxiesModule],
  controllers: [ChatAgentController, ChatAgentApiController],
  providers: [
    ChatAgentService,
    LLMProcessStateMachineProvider,
    LangGraphAgentProvider,
    LLMFuncToolsProvider,
    ChatMessageHistoryProvider,
    ChatMessageHistoryService,
    BusinessProfileService,
    ThusoClientProxiesService,
    ChatMessageHistoryApiService
  ],
  exports: [TypeOrmModule]
})
export class ChatAgentModule { }
