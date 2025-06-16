import { Module } from '@nestjs/common';
import { BusinessesController } from './controllers/businesses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppBusiness } from './entities/whatsapp-business.entity';
import { BusinessProfile } from './entities/business-profile.entity';
import { WhatsAppNumber } from './entities/whatsapp-number.entity';
import { LoggingModule } from '@lib/logging';
import { BusinessesService } from './services/businesses.service';
import { BusinessesApiController } from './controllers/businesses.api.controller';
import { BusinessesApiService } from './services/businesses.api.service';
import { WhatsAppTemplate } from './entities/whatsapp-template.entity';
import { WhatsAppTemplateService } from './services/businesses.templates.service';
import { WhatsAppTemplateController } from './controllers/businesses.template.controller';
import { WhatsAppTemplateRmqController } from './controllers/businesses.template.rmq.controller';
import { BusinessesRmqService } from './services/businesses.rmq.service';
import { BusinessesRmqController } from './controllers/businesses.rmq.controller';
import { ThusoClientProxiesModule, ThusoClientProxiesService } from '@lib/thuso-client-proxies';
import { GraphAPIService, ThusoCommonModule } from '@lib/thuso-common';
import { ExternBusinessService } from './services/externbusiness.service';

@Module({
  imports: [TypeOrmModule.forFeature([WhatsAppBusiness, BusinessProfile, WhatsAppNumber, WhatsAppTemplate]), LoggingModule, ThusoCommonModule, ThusoClientProxiesModule],
  providers: [
    BusinessesService,
    BusinessesApiService,
    BusinessesRmqService,
    WhatsAppTemplateService,
    ThusoClientProxiesService,
    GraphAPIService,
    ExternBusinessService,
    {
      provide: "IExternBusinessService",
      useClass: ExternBusinessService
    }
  ],
  controllers: [
    BusinessesController,
    BusinessesApiController,
    WhatsAppTemplateController,
    WhatsAppTemplateRmqController,
    BusinessesRmqController
  ],
  exports: [TypeOrmModule, "IExternBusinessService"]
})
export class BusinessesModule { }
