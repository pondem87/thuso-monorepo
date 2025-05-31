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
import { ChangePasswordDto } from '../dto/change-password.dto';
import { EditUserDto } from '../dto/edit-user.dto';
import { OnboardingDto } from '../dto/onboarding.dto';

/*
*  AccountsController provides endpoints for managing users and accounts and related operations from the frontend.
*
*/

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
    /*
     *  These methods are focused on user management, such as creating accounts, resetting passwords, and verifying accounts.
    */

    /**
     * Creates a new account and root user.
     * This endpoint is used to create an account with a root user in one step.
     * @param data - The data required to create the account and root user.
     * @returns The created account name and root user email.
    */
    @Post('create-account-user')
    createAccountAndRootUser(
        @Body() data: CreateAccountAndRootUserDto
    ) {
        return this.accountsService.createAccountAndRootUser(data)
    }

    /*
     *  Creates new user assigned to the account which issued the invitation with invitationId
    */
    @Post('create-user/:invitationId')
    createAccountWithInvite(
        @Body() data: CreateUserDto,
        @Param('invitationId') invitationId: string
    ) {
        return this.accountsService.createUserWithInvite(invitationId, data)
    }

    /*
     * When the invited user already has an account, this method creates the account-user link
    */
    @Get('accept-invitation/:invitationId')
    acceptInvitation(
        @Param('invitationId') invitationId: string
    ) {
        return this.accountsService.acceptInvitation(invitationId)
    }


    /**
     * Creates a new account with the user provided in the request.
     * This endpoint is used to create an account for an existing user.
     * @param data - The data required to create the account.
     * @param request - The request object containing the user information. - populated by AuthGuard
     * @returns The created account information.
    */
    @UseGuards(AuthGuard)
    @Post('create-account')
    createAccountWithUser(
        @Body() data: CreateAccountDto,
        @Request() request
    ) {
        const { user }: { user: User } = request
        return this.accountsService.createAccountWithUser(user, data)
    }

    /**
     * Requests a password reset for the user with the provided email.
     * This endpoint is used to initiate the password reset process.
     * @param data - The data containing the email of the user requesting the password reset.
     * @returns A confirmation message indicating that the password reset request was successful.
    */
    @Post('request-password-reset')
    @HttpCode(HttpStatus.OK)
    requestPasswordReset(
        @Body() data: RequestPasswordResetDto
    ) {
        return this.accountsService.requestPasswordReset(data.email.toLowerCase().trim())
    }

    /*
     * Resets the password for the user with the provided data.
     * The data includes the email, new password, and the reset token.
     * 
    */
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    resetPassword(
        @Body() data: PasswordResetDto
    ) {
        return this.accountsService.passwordReset(data)
    }


    /**
     * Retrieves the current user information.
     * Used by frontend to get the logged-in user's details.
     * @param request - The request object containing the user information. - populated by AuthGuard
     * 
    */
    @UseGuards(AuthGuard)
    @Get('this')
    getUser(
        @Request() request
    ) {
        const { user }: { user: User } = request
        return new UserDto(user)
    }

    /**
     * Verifies the user's account using the provided verification code.
     * This endpoint is used to complete the account verification process.
     * @param data - The data containing the verification code.
     * @param request - The request object containing the user information. - populated by AuthGuard
     * @returns A confirmation message indicating that the account was verified successfully.
    */
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

    /*
     * Changes the password for the current user.
     * This endpoint is used to update the user's
     */
    @UseGuards(AuthGuard)
    @Post('user/change-password')
    changePassword(
        @Body() changePassDto: ChangePasswordDto,
        @Request() request
    ) {
        const { user }: { user: User } = request
        return this.accountsService.changePassword(user, changePassDto)
    }

    /**
     * Changes the details of the current user.
     * This endpoint is used to update the user's details such as name, email, etc.
     * @param editUserDto - The data containing the new user details.
     * @param request - The request object containing the user information. - populated by AuthGuard
     * @returns The updated user information.
    */
    @UseGuards(AuthGuard)
    @Post('user/change-details')
    changeDetails(
        @Body() editUserDto: EditUserDto,
        @Request() request
    ) {
        const { user }: { user: User } = request
        return this.accountsService.changeUserDetails(user, editUserDto)
    }

    //// ACCOUNT FOCUSED METHODS
    /*
     *  These methods are focused on account management, such as inviting users, getting account details, and onboarding.
    */

    /*
     * Invites a user to the specified account by sending an invitation email.
    */
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
        return this.accountsService.inviteAccountUser(user, accountId, data.email.toLowerCase().trim())
    }

    /**
     * Retrieves the current account details.
     * @param accountId - The ID of the account.
     * @returns account details object.
    */
    @UseGuards(AuthGuard, PermissionsGuard)
    @PermissionsDecorator([
        { entity: "account", action: PermissionAction.READ }
    ])
    @Get(':account/get-account')
    getAccount(
        @Param('account') accountId: string
    ) {
        return this.accountsService.findOneAccountById(accountId)
    }

    /**
     * Changes the onboarding state for the current user.
     * @param accountId - The ID of the account.
     * @returns user details object with updated onboarding state.
    */
    @UseGuards(AuthGuard, PermissionsGuard)
    @PermissionsDecorator([
        { entity: "account", action: PermissionAction.READ }
    ])
    @Post(':account/onboarding')
    progressOnboarding(
        @Body() dto: OnboardingDto,
        @Request() request
    ) {
        const { user }: { user: User } = request
        return this.accountsService.progressOnboarding(user, dto)
    }
}
