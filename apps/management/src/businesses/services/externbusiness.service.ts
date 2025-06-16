import { LoggingService } from "@lib/logging";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { IExternBusinessService } from "../interfaces/iexternbusiness.service";
import { WhatsAppBusiness } from "../entities/whatsapp-business.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

/*
 * This class provides services to other modules within the management service
*/
@Injectable()
export class ExternBusinessService implements IExternBusinessService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @InjectRepository(WhatsAppBusiness)
        private readonly whatsAppBusinessRepo: Repository<WhatsAppBusiness>
    ) {
        this.logger = this.loggingService.getLogger({
            module: "business",
            file: "externbusiness.service"
        })

        this.logger.info("ExternBusinessService initialised")
    }

    async getBusinessByWabaId(wabaId: string): Promise<WhatsAppBusiness|null> {
        return await this.whatsAppBusinessRepo.findOne({ where: { wabaId }, relations: { appNumbers: true, businessProfile: true }})
    }

    async getAccountBusinesses(accountId: string): Promise<WhatsAppBusiness[]|null> {
        return await this.whatsAppBusinessRepo.find({ where: { accountId }, relations: { businessProfile: true, appNumbers: true }})
    }
}