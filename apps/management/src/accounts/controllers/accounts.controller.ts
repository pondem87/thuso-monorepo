import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Request, UseGuards } from '@nestjs/common';
import { LoggingService } from '@lib/logging';
import { Logger } from 'winston';
import { AuthGuard } from '../../auth/auth-guard';
import { CreateAccountAndRootUserDto } from '../dto/create-account-and-root-user.dto';
import { CreateAccountDto } from '../dto/create-account.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { PasswordResetDto } from '../dto/password-reset.dto';
import { RequestPasswordResetDto } from '../dto/request-password-reset.dto';
import { UserDto } from '../dto/response-dtos.dto';
import { VerifyAccountDto } from '../dto/verify-account.dto';
import { User } from '../entities/user.entity';
import { PermissionsGuard } from '../permissions-guard';
import { PermissionsDecorator } from '../permissions.decorator';
import { PermissionAction } from '../types';
import { AccountsService } from '../services/accounts.service';

@Controller('management/accounts')
export class AccountsController {
    private logger: Logger

    constructor(
        private readonly accountsService: AccountsService,
        private readonly loggingService: LoggingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "accounts",
            file: "accounts.controller"
        })

        this.logger.info("AccountsController Init")
    }

    //// USER FOCUSED METHODS
    @Post('create-account-user')
    createAccountAndRootUser(
        @Body() data: CreateAccountAndRootUserDto
    ) {
        return this.accountsService.createAccountAndRootUser(data)
    }

    @Post('create-user/:invitationId')
    createAccountWithInvite(
        @Body() data: CreateUserDto,
        @Param('invitationId') invitationId: string
    ) {
        return this.accountsService.createUserWithInvite(invitationId, data)
    }

    @Get('accept-invitation/:invitationId')
    acceptInvitation(
        @Param('invitationId') invitationId: string
    ) {
        return this.accountsService.acceptInvitation(invitationId)
    }

    @UseGuards(AuthGuard)
    @Post('create-account')
    createAccountWithUser(
        @Body() data: CreateAccountDto,
        @Request() request
    ) {
        const { user }: { user: User } = request
        return this.accountsService.createAccountWithUser(user, data)
    }

    @Post('request-password-reset')
    @HttpCode(HttpStatus.OK)
    requestPasswordReset(
        @Body() data: RequestPasswordResetDto
    ) {
        return this.accountsService.requestPasswordReset(data.email)
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    resetPassword(
        @Body() data: PasswordResetDto
    ) {
        return this.accountsService.passwordReset(data)
    }

    @UseGuards(AuthGuard)
    @Get('this')
    getUser(
        @Request() request
    ) {
        const { user }: { user: User } = request
        return new UserDto(user)
    }

    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.ACCEPTED)
    @Post('verify')
    verifyAccount(
        @Body() data: VerifyAccountDto,
        @Request() request
    ) {
        const { user }: { user: User } = request
        return this.accountsService.verifyAccount(user, data.verificationCode)
    }

    //// ACCOUNT FOCUSED METHODS
    @UseGuards(AuthGuard, PermissionsGuard)
    @PermissionsDecorator([
        { entity: "invitation", action: PermissionAction.CREATE }
    ])
    @Post(':account/invite-user')
    inviteAccountUser(
        @Body() data: { email: string },
        @Param('account') accountId: string,
        @Request() request
    ) {
        const { user }: { user: User } = request
        return this.accountsService.inviteAccountUser(user, accountId, data.email)
    }
}
