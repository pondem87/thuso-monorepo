import { NestFactory } from '@nestjs/core';
import { ManagementModule } from './management.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
	const app = await NestFactory.create(ManagementModule);
	const configService = app.get<ConfigService>(ConfigService)

	const port = parseInt(configService.get<string>("THUSO_MANAGEMENT_PORT")) || 3000
	await app.listen(port);
}
bootstrap();
