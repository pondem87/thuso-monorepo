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

@Module({
	imports: [TypeOrmModule.forFeature([Customer, Preferences, CustomerAction]), LoggingModule, ThusoClientProxiesModule],
	controllers: [CrmController, CrmChatsController, CrmRmqController],
	providers: [
		LoggingService,
		CrmService,
		CrmChatsService,
	],
	exports: [TypeOrmModule]
})
export class CrmModule { }
