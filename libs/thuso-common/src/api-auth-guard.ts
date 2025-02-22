import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Logger } from 'winston';
import { LoggingService } from '@lib/logging';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiAuthGuard implements CanActivate {
    private logger: Logger
    private apiToken: string

    constructor(
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "ThusoCommon",
            file: "api-auth-guard"
        })

        this.logger.info("Init ApiAuthGuard")
        this.apiToken = this.configService.get<string>("THUSO_S2S_TOKEN")
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        
        if (!token) {
            throw new UnauthorizedException();
        }

        if (token !== this.apiToken) {
            throw new UnauthorizedException();
        }

        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}