import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from 'winston';
import { LoggingService } from '@lib/logging';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';
import { generateRandomString } from '@lib/thuso-common';
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
        private readonly configService: ConfigService,
        private readonly mailerService: MailerService
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
        if (await this.userRepository.findOneBy({ email: data.email.toLowerCase() })) {
            throw new HttpException(`Email ${data.email} already registered.`, HttpStatus.FORBIDDEN)
        }

        if (await this.accountRepository.findOneBy({ name: data.accountName.toLocaleLowerCase() })) {
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

            const emailHtml = this.generateWelcomeEmailHtml(randomString)

            const emailText = this.generateWelcomeEmailText(randomString)


            await this.sendEmail(user.email, "Account Verification", emailText, emailHtml)

            return {
                email: user.email,
                accountName: account.name
            }

        } catch (error) {
            this.logger.error("Failed to create user and account", { error: JSON.stringify(error) })
            return null
        }
    }

    async sendEmail(email: string, subject: string, text: string, html: string): Promise<boolean> {
        try {
            const info = await this.mailerService.sendMail({
                to: email,
                subject,
                from: `Thuso Information Service ${this.configService.get<string>("EMAIL_USERNAME")}`,
                text,
                html
            })

            this.logger.info("Verification email sent", { info, email })
            return true

        } catch (error) {
            this.logger.error("Verification email failed", { error: JSON.stringify(error), email })
            return false
        }
    }

    async verifyAccount(user: User, verificationCode: string): Promise<UserDto> {
        if (user.verificationCode !== verificationCode) {
            throw new HttpException("Wrong Code", HttpStatus.NOT_ACCEPTABLE)
        }

        user.verified = true,
            user.verificationCode = null

        try {
            const newUser = await this.userRepository.save(user)
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
        const emailHtml =
            `<html>
                    <head>
                    <head>
                    <body>
                        <h1>Welcome to Thuso</h1>
                        <p>Use this code to confirm password reset: <strong>${randomString}</strong></p>
                    </body>
                </html>`;

        const emailText =
            `Welcome to Thuso.\n\nUse this code to confirm password reset: ${randomString}`

        await this.sendEmail(user.email, "Password Reset Code", emailText, emailHtml)

        return { message: "Password reset code will be sent to the email if it exists" }
    }

    async passwordReset(data: PasswordResetDto) {
        const user = await this.userRepository.findOneBy({ email: data.email })

        if (user == null || user.verificationCode !== data.verificationCode) {
            throw new HttpException("Incorrect details", HttpStatus.NOT_FOUND)
        }

        user.passwordHash = await bcrypt.hash(data.password, await bcrypt.genSalt())
        await this.userRepository.save(user)
        return { message: "Password successfully reset" }
    }

    // ACCOUNT CENTERED METHODS
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

            const inviteLink = `https://manage.thuso.pfitz.co.zw/create/${invite.id}`

            // send to email
            const emailHtml =
                `<html>
                <head>
                <head>
                <body>
                    <h1>Welcome to Thuso</h1>
                    <p>You have been invited to contribute to "${account.name}" by "${user.email} (${user.forenames + " " + user.surname})" on Thuso</p>
                    <p><a href="${inviteLink}">Click here</a> to set up your account.</p>
                </body>
            </html>`;

            const emailText =
                `Welcome to Thuso.\n\nYou have been invited to contribute to "${account.name}" by "${user.email} (${user.forenames + " " + user.surname})" on Thuso`
                + `Use this link to set up your account: ${inviteLink}`

            await this.sendEmail(email, "Thuso Invitation", emailText, emailHtml)

            return { message: "Invitation sent" }
        } catch (error) {
            this.logger.error("Failed to send invitation", { email: user.email, accountId, error: JSON.stringify(error) })
            throw new HttpException("Server Failure", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

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

    async createUserWithInvite(invitationId: string, data: CreateUserDto): Promise<{ email: string, accountName: string }> {
        try {
            const invitation = await this.invitationRepository.findOne({ where: { id: invitationId }, relations: { account: true } })

            if (invitation == null) {
                throw new HttpException("Invalid Invitation", HttpStatus.NOT_FOUND)
            }

            if (data.email !== invitation.email) {
                throw new HttpException("Email does not match invitation", HttpStatus.NOT_ACCEPTABLE)
            }

            if (await this.userRepository.findOneBy({ email: data.email })) {
                throw new HttpException(`Email ${data.email} already registered.`, HttpStatus.FORBIDDEN)
            }

            const verificationCode = generateRandomString(6)

            const user = await this.userRepository.save(
                this.userRepository.create({
                    ...data,
                    passwordHash: await bcrypt.hash(data.password, await bcrypt.genSalt()),
                    verificationCode,
                    accounts: [invitation.account]
                })
            )

            const emailHtml = this.generateWelcomeEmailHtml(verificationCode)

            const emailText = this.generateWelcomeEmailText(verificationCode)

            await this.sendEmail(user.email, "Account Verification", emailText, emailHtml)


            // delete invitation
            await this.invitationRepository.delete({ id: invitationId })

            return { email: user.email, accountName: invitation.account.name }
        } catch (error) {
            this.logger.error("Failed to create user with invitation", { error: JSON.stringify(error) })
            throw new HttpException("Server Failure", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async acceptInvitation(invitationId: string): Promise<{ message: string }> {
        try {
            // get invitation
            const invitation = await this.invitationRepository.findOne({ where: { id: invitationId }, relations: { account: true } })

            // get user
            const user = await this.userRepository.findOne({ where: { email: invitation.email }, relations: { accounts: true } })

            // add account to user
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

    generateWelcomeEmailHtml(verificationCode: string) {
        return `<html>
                    <head>
                    <head>
                    <body>
                        <h1>Welcome to Thuso</h1>
                        <p>Use this code to verify your account: <strong>${verificationCode}</strong></p>
                    </body>
                </html>`;
    }

    generateWelcomeEmailText(verificationCode: string) {
        return `Welcome to Thuso.\n\nUse this code to verify your account: ${verificationCode}`
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
            this.logger.error("", { error })
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
}