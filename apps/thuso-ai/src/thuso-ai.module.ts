import { Module } from '@nestjs/common';
import { ThusoAiController } from './thuso-ai.controller';
import { ThusoAiService } from './thuso-ai.service';
import { EmbeddingModule } from './embedding/embedding.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatAgentModule } from './chat-agent/chat-agent.module';
import * as fs from "fs"
import { LoggingModule } from '@lib/logging';
import { ThusoCommonModule } from '@lib/thuso-common';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env"] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: config.get<string>("DB_TYPE") === "postgres" ? "postgres" : "sqlite",
        host: config.get<string>("DB_HOST"),
        port: config.get<number>("DB_PORT"),
        username: config.get<string>("DB_USERNAME"),
        password: config.get<string>("DB_PASSWORD"),
        database: config.get<string>("DB_DATABASE"),
        autoLoadEntities: config.get<string>("DB_AUTOLOAD_ENTITIES") === "true",
        synchronize: config.get<string>("DB_SYNCHRONISE") === "true",
        extra: {
          ssl: {
            ca: fs.readFileSync(config.get<string>("DB_CERT_PATH"))
          }
        }
      }),
      inject: [ConfigService]
    }),
    EmbeddingModule,
    ChatAgentModule
  ],
  controllers: [ThusoAiController],
  providers: [ThusoAiService, ConfigService],
})
export class ThusoAiModule { }
