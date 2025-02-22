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

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Account, User, Permission, Invitation]),
    LoggingModule, forwardRef(() => AuthModule),
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [TypeOrmModule, AccountsService]
})
export class AccountsModule {}
