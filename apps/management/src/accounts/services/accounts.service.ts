import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from 'winston';
import { LoggingService } from '@lib/logging';
import * as bcrypt from 'bcrypt';
import { AccountDataUpdatePayload, AccountUpdateChatAgentPattern, AccountUpdateMessageProcessorPattern, AccountUpdateMessengerPattern, emailHtmlTemplate, generateRandomString, SendEmailEventPattern, SendEmailQueueMessage, UserDataUpdatePayload, UserUpdateAccountsPattern } from '@lib/thuso-common';
import { CreateAccountAndRootUserDto } from '../dto/create-account-and-root-user.dto';
import { CreateAccountDto } from '../dto/create-account.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { PasswordResetDto } from '../dto/password-reset.dto';
import { AccountDto, UserDto } from '../dto/response-dtos.dto';
import { Account } from '../entities/account.entity';
import { Invitation } from '../entities/invitation.entity';
import { User } from '../entities/user.entity';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { EditUserDto } from '../dto/edit-user.dto';
import { ThusoClientProxiesService } from '@lib/thuso-client-proxies';
import { OnboardingDto } from '../dto/onboarding.dto';

/*
 *   Implements logic for the account service
 */

@Injectable()
export class AccountsService {
    private logger: Logger

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,
        @InjectRepository(Invitation)
        private readonly invitationRepository: Repository<Invitation>,
        private readonly loggingService: LoggingService,
        private readonly clientsService: ThusoClientProxiesService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "accounts",
            file: "accounts.service"
        })

        this.logger.info("Init AccountsService")
    }

    async findOneUserById(id: string): Promise<User | null> {
        try {
            return await this.userRepository.findOne({
                where: { id },
                relations: {
                    rootOf: true,
                    accounts: true,
                    permissions: true
                }
            })
        } catch (error) {
            this.logger.error("Failed to retrieve user by id", { error: JSON.stringify(error) })
            return null
        }
    }

    async findOneAccountById(id: string): Promise<AccountDto> {
        try {
            return new AccountDto(await this.accountRepository.findOne({
                where: { id },
                relations: {
                    root: true,
                    users: true,
                    invitations: true
                }
            }))
        } catch (error) {
            this.logger.error("Failed to retrieve user by id", { error: JSON.stringify(error) })
            return null
        }
    }

    async findOneUserByEmail(email: string): Promise<User | null> {
        try {
            return await this.userRepository.findOne({
                where: { email },
                relations: {
                    rootOf: true,
                    accounts: true,
                    permissions: true
                }
            })
        } catch (error) {
            this.logger.error("Failed to retrieve user by email", { email, error: JSON.stringify(error) })
            return null
        }
    }

    async createAccountAndRootUser(data: CreateAccountAndRootUserDto): Promise<{ email: string, accountName: string }> {
        // exclude duplicates
        if (await this.userRepository.findOneBy({ email: data.email.toLowerCase().trim() })) {
            throw new HttpException(`Email ${data.email} already registered.`, HttpStatus.FORBIDDEN)
        }

        if (await this.accountRepository.findOneBy({ name: data.accountName.toLowerCase().trim() })) {
            throw new HttpException(`Account name "${data.accountName}" is already in use`, HttpStatus.FORBIDDEN)
        }

        try {

            const randomString = generateRandomString(6)
            // create resources
            const userData: Partial<User> = {
                forenames: data.forenames.toLowerCase().trim(),
                surname: data.surname.toLowerCase().trim(),
                passwordHash: await bcrypt.hash(data.password, await bcrypt.genSalt()),
                email: data.email.toLowerCase().trim(),
                verified: false,
                verificationCode: randomString
            }

            const user = await this.userRepository.save(
                this.userRepository.create(userData)
            )

            const account = await this.accountRepository.save(
                this.accountRepository.create({
                    name: data.accountName.toLowerCase().trim(),
                    root: user
                })
            )

            const newUserData = {
                id: user.id,
                email: user.email,
                forenames: user.forenames,
                surname: user.surname,
                verified: user.verified,
                verificationCode: user.verificationCode,
                createdAt: user.createdAt
            }

            const newAccountData = {
                id: account.id,
                name: account.name,
                maxAllowedBusinesses: account.maxAllowedBusinesses,
                maxAllowedDailyConversations: account.maxAllowedDailyConversations,
                subscriptionEndDate: account.subscriptionEndDate,
                disabled: account.disabled,
                createdAt: account.createdAt,
                root: newUserData
            }

            const userUpdateData: UserDataUpdatePayload = {
                userData: newUserData,
                event: "NEW"
            }

            const accountUpdateData: AccountDataUpdatePayload = {
                accountData: newAccountData,
                event: "NEW"
            }

            // inform services of new account
            
            this.clientsService.emitWhatsappQueue(AccountUpdateMessengerPattern, accountUpdateData)
            this.clientsService.emitWhatsappQueue(AccountUpdateMessageProcessorPattern, accountUpdateData)
            this.clientsService.emitLlmQueue(AccountUpdateChatAgentPattern, accountUpdateData)

            // inform services of new user
            this.clientsService.emitMgntQueue(UserUpdateAccountsPattern, userUpdateData)

            return {
                email: user.email,
                accountName: account.name
            }

        } catch (error) {
            this.logger.error("Failed to create user and account", { error: JSON.stringify(error) })
            return null
        }
    }

    async verifyAccount(user: User, verificationCode: string): Promise<UserDto> {
        if (user.verificationCode !== verificationCode) {
            throw new HttpException("Wrong Code", HttpStatus.NOT_ACCEPTABLE)
        }

        user.verified = true
        user.verificationCode = null

        try {
            const newUser = await this.userRepository.save(user)
            
            const newUserData = {
                id: newUser.id,
                email: newUser.email,
                forenames: newUser.forenames,
                surname: newUser.surname,
                verified: newUser.verified,
                verificationCode: newUser.verificationCode,
                createdAt: newUser.createdAt
            }
            
            this.clientsService.emitMgntQueue(UserUpdateAccountsPattern, {
                userData: newUserData,
                event: "VERIFIED"
            } as UserDataUpdatePayload)

            return new UserDto(newUser)
        } catch (error) {
            this.logger.error("Failed to save user after verification", { email: user.email, error: JSON.stringify(error) })
            throw new HttpException("Server Error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async requestPasswordReset(email: string) {
        const user = await this.userRepository.findOneBy({ email })

        if (user == null) {
            throw new HttpException("User not found", HttpStatus.NOT_FOUND)
        }

        const randomString = generateRandomString(6)
        user.verificationCode = randomString
        await this.userRepository.save(user)

        // send to email
        const emailHtml = emailHtmlTemplate(
            `Reset Thuso Password`,
            `<p>Use this code to confirm password reset: <strong>${randomString}</strong></p>`
        )

        const emailText =
            `Reset Thuso Password\n\nUse this code to confirm password reset: ${randomString}`

        this.clientsService.emitMgntQueue(
            SendEmailEventPattern,
            {
                email: user.email,
                subject: "Password Reset Code",
                text: emailText,
                html: emailHtml
            } as SendEmailQueueMessage
        )

        return { message: "Password reset code will be sent to the email if it exists" }
    }

    async passwordReset(data: PasswordResetDto) {
        const user = await this.userRepository.findOneBy({ email: data.email.toLowerCase().trim() })

        if (user == null || user.verificationCode !== data.verificationCode) {
            throw new HttpException("Incorrect details", HttpStatus.NOT_FOUND)
        }

        user.passwordHash = await bcrypt.hash(data.password, await bcrypt.genSalt())
        await this.userRepository.save(user)
        return { message: "Password successfully reset" }
    }

    // ACCOUNT CENTERED METHODS
    /*
     * Create an invitation to join account and send the email to end user
    */
    async inviteAccountUser(user: User, accountId, email: string) {
        try {
            const account = await this.accountRepository.findOneBy({ id: accountId })

            const oldInvite = await this.invitationRepository.findOneBy({ email, account })

            const invite = oldInvite ? oldInvite : await this.invitationRepository.save(
                this.invitationRepository.create({
                    email,
                    account
                })
            )

            // check if user already exists
            const user = await this.userRepository.findOneBy({ email })

            const inviteLink = user ? `https://manage.thuso.pfitz.co.zw/accept/${invite.id}` : `https://manage.thuso.pfitz.co.zw/create/${invite.id}`

            // send to email
            const emailHtml = emailHtmlTemplate(
                `Welcome to Thuso`,
                `
                <p>You have been invited to contribute to "${account.name}" by "${user.email} (${user.forenames + " " + user.surname})" on Thuso</p>
                <p><a href="${inviteLink}">Click here</a> to set up your user account or add a guest account to your existing account.</p>
                `
            )

            const emailText =
                `Welcome to Thuso.\n\nYou have been invited to contribute to "${account.name}" by "${user.email} (${user.forenames + " " + user.surname})" on Thuso`
                + `Use this link to set up your account: ${inviteLink}`

            // send email to queue
            this.clientsService.emitMgntQueue(
                SendEmailEventPattern,
                {
                    email,
                    subject: "Thuso Invitation",
                    text: emailText,
                    html: emailHtml
                } as SendEmailQueueMessage
            )

            return { message: "Invitation sent" }
        } catch (error) {
            this.logger.error("Failed to send invitation", { email: user.email, accountId, error: JSON.stringify(error) })
            throw new HttpException("Server Failure", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    /*
     * create an account for an existing user
     * this user is a guest user for some account and now want their own account
     * 
    */
    async createAccountWithUser(user: User, data: CreateAccountDto): Promise<{ email: string, accountName: string }> {
        try {
            if (await this.accountRepository.findOneBy({ name: data.name })) {
                throw new HttpException(`Account name "${data.name}" is already in use`, HttpStatus.FORBIDDEN)
            }

            const account = await this.accountRepository.save(
                this.accountRepository.create({
                    name: data.name,
                    root: user
                })
            )

            return { email: user.email, accountName: account.name }
        } catch (error) {
            this.logger.error("Failed to create account with user", { error: JSON.stringify(error) })
            throw new HttpException("Server Failure", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    /*
     * When a user with no prior account accepts invitation to join account
    */
    async createUserWithInvite(invitationId: string, data: CreateUserDto): Promise<{ email: string, accountName: string }> {
        try {
            // check if invitation id points to invitation we issued
            const invitation = await this.invitationRepository.findOne({ where: { id: invitationId }, relations: { account: true } })

            if (invitation == null) {
                throw new HttpException("Invalid Invitation", HttpStatus.NOT_FOUND)
            }

            // the email of user account being created should be the same as the invitation email
            if (data.email.toLowerCase().trim() !== invitation.email.toLowerCase().trim()) {
                throw new HttpException("Email does not match invitation", HttpStatus.NOT_ACCEPTABLE)
            }

            if (await this.userRepository.findOneBy({ email: data.email.toLowerCase().trim() })) {
                throw new HttpException(`Email ${data.email} already registered.`, HttpStatus.FORBIDDEN)
            }

            const verificationCode = generateRandomString(6)

            const user = await this.userRepository.save(
                this.userRepository.create({
                    ...data,
                    email: data.email.toLowerCase().trim(),
                    passwordHash: await bcrypt.hash(data.password, await bcrypt.genSalt()),
                    verificationCode,
                    accounts: [invitation.account]
                })
            )

            // new user
            const newUserData = {
                id: user.id,
                email: user.email,
                forenames: user.forenames,
                surname: user.surname,
                verified: user.verified,
                verificationCode: user.verificationCode,
                createdAt: user.createdAt
            }
            
            // inform other services of new accont creation
            this.clientsService.emitMgntQueue(UserUpdateAccountsPattern, {
                userData: newUserData,
                event: "NEW-GUEST"
            } as UserDataUpdatePayload)

            // delete invitation
            await this.invitationRepository.delete({ id: invitationId })

            return { email: user.email, accountName: invitation.account.name }
        } catch (error) {
            this.logger.error("Failed to create user with invitation", { error: JSON.stringify(error) })
            throw new HttpException("Server Failure", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    /*
    * When an existing user is invited to another account and accepts invitation
    */
    async acceptInvitation(invitationId: string): Promise<{ message: string }> {
        try {
            // get invitation with matching id
            const invitation = await this.invitationRepository.findOne({ where: { id: invitationId }, relations: { account: true } })

            // get invited user 
            const user = await this.userRepository.findOne({ where: { email: invitation.email }, relations: { accounts: true } })

            // add account to user's accounts
            user.accounts.push(invitation.account)

            // save user
            const newUser = await this.userRepository.save(user)

            // delete invitation
            await this.invitationRepository.delete(invitation)

            return { message: "Invitation accepted" }
        } catch (error) {
            this.logger.error("Failed to accept invitation", { error: JSON.stringify(error) })
            throw new HttpException("Server Failure", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async changePassword(user: User, changePassDto: ChangePasswordDto) {

        if (!await bcrypt.compare(changePassDto.oldPassword, user.passwordHash)) {
            throw new UnauthorizedException()
        }

        if (changePassDto.repeatPassword) {
            if (!(changePassDto.newPassword === changePassDto.repeatPassword)) {
                throw new HttpException("Password mismatch", HttpStatus.BAD_REQUEST)
            }
        }

        try {
            user.passwordHash = await bcrypt.hash(changePassDto.newPassword, await bcrypt.genSalt())
            await this.userRepository.save(user)
            return { success: true }
        } catch (error) {
            this.logger.error("Error while changing password", { error })
            throw new HttpException("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async changeUserDetails(user: User, editUserDto: EditUserDto) {
        const keys = Object.keys(editUserDto)

        for (const key of keys) {
            user[key] = (editUserDto[key] as string).trim().toLowerCase()
        }

        return new UserDto(await this.userRepository.save(user))
    }

    async progressOnboarding(user: User, dto: OnboardingDto) {
        try {
            user.onboardingState = dto.next
            return new UserDto(await this.userRepository.save(user))
        } catch (error) {
            this.logger.error("Error while updating onboarding state", { error })
            throw new HttpException("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}