import { NestFactory } from '@nestjs/core';
import { ManagementModule } from './management.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
	const app = await NestFactory.create(ManagementModule);
	const configService = app.get<ConfigService>(ConfigService)

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.RMQ,
		options: {
			urls: [`${configService.get<string>("THUSO_RMQ_URL")}:${configService.get<string>("THUSO_RMQ_PORT")}`],
			queue: configService.get<string>("MANAGEMENT_RMQ_QUEUENAME"),
			queueOptions: {
				durable: configService.get<string>("THUSO_RMQ_IS_DURABLE") === "true" ? true : false
			}
		}
	})

	await app.startAllMicroservices()

	const port = parseInt(configService.get<string>("THUSO_MANAGEMENT_PORT")) || 3000
	await app.listen(port);
}
bootstrap();
