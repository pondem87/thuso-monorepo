import { LoggingService } from '@lib/logging';
import { Body, Controller, HttpCode, HttpStatus, Post, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Logger } from 'winston';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/user-login.dto';
import { AuthGuard } from './auth-guard';
import { User } from '../accounts/entities/user.entity';
import { AccountsService } from '../accounts/services/accounts.service';

@Controller('management/auth')
export class AuthController {

    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly accountsService: AccountsService,
        private readonly authService: AuthService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "Auth",
            file: "auth.controller"
        })

        this.logger.info("Init AuthController")
    }

    @Post('login')
    @HttpCode(HttpStatus.ACCEPTED)
    async login(
        @Body() loginDto: LoginDto
    ) {
        var user = await this.accountsService.findOneUserByEmail(loginDto.email.toLowerCase().trim())
        if (user === null) {
            throw new UnauthorizedException()
        }

        return this.authService.login(user, loginDto.password)
    }

    @UseGuards(AuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.ACCEPTED)
    async logout(
        @Request() request
    ) {
        const { token, user }: { token: string, user: User } = request
        await this.authService.logout(token)
        this.logger.info("User logged out all tokens", { userEmail: user.email })
        return
    }

    @UseGuards(AuthGuard)
    @Post('logout-all')
    @HttpCode(HttpStatus.ACCEPTED)
    async logoutAll(
        @Request() request
    ) {
        const { user }: { user: User } = request
        await this.authService.logoutAll(user.id)
        this.logger.info("User logged out", { userEmail: user.email })
        return
    }
}