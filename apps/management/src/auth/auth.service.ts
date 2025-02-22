import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt'
import { InjectRepository } from '@nestjs/typeorm';
import { UserToken } from './entities/user-token.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Logger } from 'winston';
import { User } from '../accounts/entities/user.entity';
import { LoggingService } from '@lib/logging';
import { JwtPayload } from './types';
import { ConfigService } from '@nestjs/config';
import { UserDto } from '../accounts/dto/response-dtos.dto';

@Injectable()
export class AuthService {
    
    private logger: Logger

    constructor(
        @InjectRepository(UserToken)
        private readonly userTokenRepository: Repository<UserToken>,
        private readonly loggingService: LoggingService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "AuthService",
            file: "auth.service"
        })

        this.logger.info("Init AuthService")
    }

    async login(user: User, password: string): Promise<{ token: string, user: UserDto }> {
        
        if (!await bcrypt.compare(password, user.passwordHash)) {
            throw new UnauthorizedException()
        }

        const jwtPayload: JwtPayload = {
            userId: user.id
        }

        const token = await this.jwtService.signAsync(jwtPayload, {
            secret: this.configService.get<string>("JWT_SECRET")
        })

        try {
            await this.userTokenRepository.save(
                this.userTokenRepository.create({
                    userId: user.id,
                    token
                })
            );
            
            return { token, user: new UserDto(user) }
        } catch (error) {
            this.logger.error("Database Operation failed: while saving jwt token", error)
            throw new HttpException(error.detail ? error.detail : "Database Operation failed", HttpStatus.NOT_ACCEPTABLE)
        }
    }

    async getToken(token: string, userId: string): Promise<UserToken> {
        try {
            return await this.userTokenRepository.findOne({
                where: { userId, token }
            })
        } catch (error) {
            this.logger.error("Database Operation failed: while retrieving jwt token", error)
            throw new HttpException(error.detail ? error.detail : "Database Operation failed", HttpStatus.NOT_ACCEPTABLE)
        }
    }

    async deleteTokens(userId: string): Promise<UserToken> {
        try {
            return await this.userTokenRepository.findOne({
                where: { userId }
            })
        } catch (error) {
            this.logger.error("Database Operation failed: while deleting jwt tokens", error)
            throw new HttpException(error.detail ? error.detail : "Database Operation failed", HttpStatus.NOT_ACCEPTABLE)
        }
    }

    async logoutAll(userId: string) {
        try {
            await this.userTokenRepository.delete({ userId })
        } catch (error) {
            this.logger.error("Database Operation failed: while deleting all tokens", error)
            throw new HttpException(error.detail ? error.detail : "Database Operation failed", HttpStatus.INTERNAL_SERVER_ERROR) 
        }
    }

    async logout(token: string) {
        try {
            await this.userTokenRepository.delete({ token })
        } catch (error) {
            this.logger.error("Database Operation failed: while deleting current token", error)
            throw new HttpException(error.detail ? error.detail : "Database Operation failed", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}
