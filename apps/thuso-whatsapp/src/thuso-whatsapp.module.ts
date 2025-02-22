import { Module } from '@nestjs/common';
import { ThusoWhatsappController } from './thuso-whatsapp.controller';
import { ThusoWhatsappService } from './thuso-whatsapp.service';
import { MessageProcessorModule } from './message-processor/message-processor.module';
import { MessengerModule } from './messenger/messenger.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as fs from "fs"

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
    WhatsappModule, MessageProcessorModule, MessengerModule],
  controllers: [ThusoWhatsappController],
  providers: [ThusoWhatsappService],
})
export class ThusoWhatsappModule { }
