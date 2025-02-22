import { NestFactory } from '@nestjs/core';
import { ThusoAiModule } from './thuso-ai.module';

async function bootstrap() {
  const app = await NestFactory.create(ThusoAiModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
