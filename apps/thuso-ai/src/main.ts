import { NestFactory } from '@nestjs/core';
import { ThusoAiModule } from './thuso-ai.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LangGraphAgentProvider } from './chat-agent/agents/langgraph-agent.provider';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(ThusoAiModule);
	const configService = app.get<ConfigService>(ConfigService)

	app.useGlobalPipes(new ValidationPipe())

	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.RMQ,
		options: {
			urls: [`${configService.get<string>("THUSO_RMQ_URL")}:${configService.get<string>("THUSO_RMQ_PORT")}`],
			queue: configService.get<string>("AI_RMQ_QUEUENAME"),
			prefetchCount: parseInt(configService.get<string>("RABBITMQ_PREFETCH_COUNT")) || 5,
			queueOptions: {
				durable: configService.get<string>("THUSO_RMQ_IS_DURABLE") === "true" ? true : false
			}
		}
	})

	const langGraphAgentProvider = app.get<LangGraphAgentProvider>(LangGraphAgentProvider)
	await langGraphAgentProvider.setUpCheckPointer()

	await app.startAllMicroservices()
	const port = parseInt(configService.get<string>("THUSO_AI_PORT")) || 3000
	await app.listen(port);
}
bootstrap();
