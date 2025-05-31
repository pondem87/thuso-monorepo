import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from './types';
import { AuthService } from './auth.service';
import { Logger } from 'winston';
import { LoggingService } from '@lib/logging';
import { ConfigService } from '@nestjs/config';
import { AccountsService } from '../accounts/services/accounts.service';

/*
 * AuthGuard is a guard that checks if the user is authenticated
 * Attaches the user object to the request
*/
@Injectable()
export class AuthGuard implements CanActivate {

    private logger: Logger

    constructor(
        private readonly jwtService: JwtService,
        private readonly loggingService: LoggingService,
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
        private readonly accountsService: AccountsService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "AuthGuard",
            file: "auth.guard"
        })

        this.logger.info("Init AuthGuard")
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        
        if (!token) {
            throw new UnauthorizedException();
        }

        try {
            const payload: JwtPayload = await this.jwtService.verifyAsync(
                token,
                {
                    secret: this.configService.get<string>("JWT_SECRET")
                }
            );
            // We're assigning the payload to the request object here
            // so that we can access it in our route handlers
            const userId = (await this.authService.getToken(token, payload.userId)).userId
            const user = await this.accountsService.findOneUserById(userId)
            if (!user) {
                await this.authService.deleteTokens(userId)
                throw new UnauthorizedException();
            }
            request['user'] = user
            // so we can use it in the logout route to logout this token
            request['token'] = token
        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}