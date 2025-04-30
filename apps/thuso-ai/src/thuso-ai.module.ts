import { Module } from '@nestjs/common';
import { ThusoAiController } from './thuso-ai.controller';
import { ThusoAiService } from './thuso-ai.service';
import { EmbeddingModule } from './embedding/embedding.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatAgentModule } from './chat-agent/chat-agent.module';
import AppDataSource from './db/datasource'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env"] }),
    TypeOrmModule.forRoot(AppDataSource.options),
    EmbeddingModule,
    ChatAgentModule
  ],
  controllers: [ThusoAiController],
  providers: [ThusoAiService, ConfigService],
})
export class ThusoAiModule { }
