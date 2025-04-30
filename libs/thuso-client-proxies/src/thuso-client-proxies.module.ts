import { Module } from '@nestjs/common';
import { ThusoClientProxiesService } from './thuso-client-proxies.service';
import { LlmRmqClient, MgntRmqClient, WhatsappRmqClient } from '@lib/thuso-common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { LoggingModule } from '@lib/logging';

@Module({
	imports: [LoggingModule],
	providers: [
		ThusoClientProxiesService,
		{
			provide: MgntRmqClient,
			useFactory: (configService: ConfigService) => {
				return ClientProxyFactory.create({
					transport: Transport.RMQ,
					options: {
						urls: [`${configService.get<string>("THUSO_RMQ_URL")}:${configService.get<string>("THUSO_RMQ_PORT")}`],
						queue: configService.get<string>("MANAGEMENT_RMQ_QUEUENAME"),
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
							durable: configService.get<string>("THUSO_RMQ_IS_DURABLE") === "true"  ? true : false
						},
					},
				})
			},
			inject: [ConfigService]
		},
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
		}
	],
	exports: [ThusoClientProxiesService, MgntRmqClient, WhatsappRmqClient, LlmRmqClient],
})
export class ThusoClientProxiesModule { }
