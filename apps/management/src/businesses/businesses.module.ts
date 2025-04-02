import { Module } from '@nestjs/common';
import { BusinessesController } from './controllers/businesses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppBusiness } from './entities/whatsapp-business.entity';
import { BusinessProfile } from './entities/business-profile.entity';
import { WhatsAppNumber } from './entities/whatsapp-number';
import { LoggingModule } from '@lib/logging';
import { BusinessesService } from './services/businesses.service';
import { BusinessesApiController } from './controllers/businesses.api.controller';
import { BusinessesApiService } from './services/businesses.api.service';
import { MgntRmqClient } from '@lib/thuso-common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  imports: [TypeOrmModule.forFeature([WhatsAppBusiness, BusinessProfile, WhatsAppNumber]), LoggingModule],
  providers: [
    BusinessesService,
    BusinessesApiService,
    {
      provide: MgntRmqClient,
      useFactory: (configService: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [`${configService.get<string>("THUSO_RMQ_URL")}:${configService.get<string>("THUSO_RMQ_PORT")}`],
            queue: configService.get<string>("MANAGEMENT_RMQ_QUEUENAME"),
            // noAck: false,
            queueOptions: {
              durable: configService.get<string>("THUSO_RMQ_IS_DURABLE") === "true" ? true : false
            },
          },
        });
      },
      inject: [ConfigService],
    }
  ],
  controllers: [BusinessesController, BusinessesApiController],
  exports: [TypeOrmModule]
})
export class BusinessesModule { }
