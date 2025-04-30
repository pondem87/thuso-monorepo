import { Module } from '@nestjs/common';
import { MediaController } from './controllers/media.controller';
import { MediaService } from './services/media.service';
import { MgntRmqClient } from '@lib/thuso-common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaFile } from './entities/media.entity';
import { LoggingModule, LoggingService } from '@lib/logging';
import { MediaRmqController } from './controllers/media.rmq.controller';
import { ThusoClientProxiesModule, ThusoClientProxiesService } from '@lib/thuso-client-proxies';

@Module({
	imports: [TypeOrmModule.forFeature([MediaFile]), LoggingModule, ThusoClientProxiesModule],
	controllers: [MediaController, MediaRmqController],
	providers: [
		MediaService,
		LoggingService,
		ThusoClientProxiesService
	],
	exports: [TypeOrmModule]
})
export class MediaModule { }
