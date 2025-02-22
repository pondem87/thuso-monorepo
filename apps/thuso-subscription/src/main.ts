import { NestFactory } from '@nestjs/core';
import { ThusoSubscriptionModule } from './thuso-subscription.module';

async function bootstrap() {
  const app = await NestFactory.create(ThusoSubscriptionModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
