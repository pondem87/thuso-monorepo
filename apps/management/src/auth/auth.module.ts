import { forwardRef, Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserToken } from './entities/user-token.entity';
import { LoggingModule } from '@lib/logging';
import { AccountsModule } from '../accounts/accounts.module';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth-guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserToken]),
    LoggingModule,
    forwardRef(() => AccountsModule)
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtService, AuthGuard],
  exports: [TypeOrmModule, AuthService, AuthGuard, JwtService]
})
export class AuthModule {}
