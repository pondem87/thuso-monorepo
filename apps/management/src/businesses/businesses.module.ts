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

@Module({
  imports: [TypeOrmModule.forFeature([WhatsAppBusiness, BusinessProfile, WhatsAppNumber]), LoggingModule],
  providers: [BusinessesService, BusinessesApiService],
  controllers: [BusinessesController, BusinessesApiController],
  exports: [TypeOrmModule]
})
export class BusinessesModule {}
