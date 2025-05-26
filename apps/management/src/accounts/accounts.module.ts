import { forwardRef, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';
import { User } from './entities/user.entity';
import { Permission } from './entities/permission.entity';
import { LoggingModule } from '@lib/logging';
import { AuthModule } from '../auth/auth.module';
import { Invitation } from './entities/invitation.entity';
import { AccountsController } from './controllers/accounts.controller';
import { AccountsService } from './services/accounts.service';
import { AccountsApiController } from './controllers/account.api.controller';
import { AccountsApiService } from './services/accounts.api.service';
import { AccountsRmqController } from './controllers/accounts.rmq.controller';
import { ThusoClientProxiesModule, ThusoClientProxiesService } from '@lib/thuso-client-proxies';
import { AccountsRmqService } from './services/accounts.rmq.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Account, User, Permission, Invitation]),
    LoggingModule, forwardRef(() => AuthModule),
    ThusoClientProxiesModule
  ],
  controllers: [AccountsController, AccountsApiController, AccountsRmqController],
  providers: [
    AccountsService,
    AccountsApiService,
    ThusoClientProxiesService,
    AccountsRmqService
  ],
  exports: [TypeOrmModule, AccountsService]
})
export class AccountsModule { }
