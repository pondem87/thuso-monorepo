import { LoggingService } from "@lib/logging";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Logger } from "winston";
import { Account } from "../entities/account.entity";

@Injectable()
export class AccountsApiService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>
    ) {
        this.logger = this.loggingService.getLogger({
            module: "accounts",
            file: "accounts.api.service"
        })

        this.logger.info("Accounts API Service initialized")
    }

    getAccountInfo(accountId: string) {
        try {
            return this.accountRepository.findOne({
                where: { id: accountId }
            })
        } catch (error) {
            this.logger.error("Error while getting account information by id", { accountId, error })
            throw new HttpException("Failed to get account info", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}