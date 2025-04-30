import { Module } from '@nestjs/common';
import { ThusoWhatsappController } from './thuso-whatsapp.controller';
import { ThusoWhatsappService } from './thuso-whatsapp.service';
import { MessageProcessorModule } from './message-processor/message-processor.module';
import { MessengerModule } from './messenger/messenger.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import AppDataSource from './db/datasource'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env"] }),
    TypeOrmModule.forRoot(AppDataSource.options),
    WhatsappModule, MessageProcessorModule, MessengerModule],
  controllers: [ThusoWhatsappController],
  providers: [ThusoWhatsappService],
})
export class ThusoWhatsappModule { }
