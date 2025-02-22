import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { WhatsappRmqClient } from '@lib/thuso-common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { LoggingModule, LoggingService } from '@lib/logging';

@Module({
	imports: [ConfigModule, LoggingModule],
	controllers: [WhatsappController],
	providers: [
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
		},
		WhatsappService,
		ConfigService,
		LoggingService
	]
})
export class WhatsappModule { }
