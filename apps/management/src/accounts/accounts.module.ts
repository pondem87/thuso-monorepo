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
import { MgntRmqClient } from '@lib/thuso-common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { AccountsApiController } from './controllers/account.api.controller';
import { AccountsApiService } from './services/accounts.api.service';
import { AccountsRmqController } from './controllers/accounts.rmq.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Account, User, Permission, Invitation]),
    LoggingModule, forwardRef(() => AuthModule),
  ],
  controllers: [AccountsController, AccountsApiController, AccountsRmqController],
  providers: [
    AccountsService,
    AccountsApiService,
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
  exports: [TypeOrmModule, AccountsService]
})
export class AccountsModule { }
