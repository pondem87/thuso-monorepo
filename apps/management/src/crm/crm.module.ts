import { Module } from '@nestjs/common';
import { CrmController } from './controllers/crm.controller';
import { CrmService } from './services/crm.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { Preferences } from './entities/prefs.entity';
import { LoggingModule, LoggingService } from '@lib/logging';
import { ThusoClientProxiesModule } from '@lib/thuso-client-proxies';
import { CustomerAction } from './entities/action.entity';
import { CrmChatsService } from './services/crm.chats.service';
import { CrmChatsController } from './controllers/crm.chats.controller';
import { CrmRmqController } from './controllers/crm.rmq.controller';
import { Campaign } from './entities/campaign.entity';
import { CampaignMessage } from './entities/campaign-message.entity';
import { CampaignController } from './controllers/crm.campaign.controller';
import { CampaignRmqController } from './controllers/crm.campaign.rmq.controller';
import { CampaignService } from './services/crm.campaign.service';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
	imports: [TypeOrmModule.forFeature([Customer, Preferences, CustomerAction, Campaign, CampaignMessage]), LoggingModule, ThusoClientProxiesModule, BusinessesModule],
	controllers: [CrmController, CrmChatsController, CrmRmqController, CampaignController, CampaignRmqController],
	providers: [
		LoggingService,
		CrmService,
		CrmChatsService,
		CampaignService
	],
	exports: [TypeOrmModule]
})
export class CrmModule { }
