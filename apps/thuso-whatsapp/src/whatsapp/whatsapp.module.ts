import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggingModule, LoggingService } from '@lib/logging';
import { ThusoClientProxiesModule, ThusoClientProxiesService } from '@lib/thuso-client-proxies';

@Module({
	imports: [ConfigModule, LoggingModule, ThusoClientProxiesModule],
	controllers: [
		WhatsappController
	],
	providers: [
		ThusoClientProxiesService,
		WhatsappService,
		ConfigService,
		LoggingService
	]
})
export class WhatsappModule { }
