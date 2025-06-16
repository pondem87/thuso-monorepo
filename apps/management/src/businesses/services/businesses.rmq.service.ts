import { LoggingService } from "@lib/logging"
import { Injectable } from "@nestjs/common"
import { WhatsAppBusiness } from "../entities/whatsapp-business.entity"
import { InjectRepository } from "@nestjs/typeorm"
import { Logger } from "winston"
import { Repository } from "typeorm"
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies"

/*
 * Provides functionality for the rabbitmq handlers for the businesses module.
*/
@Injectable()
export class BusinessesRmqService {
    
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @InjectRepository(WhatsAppBusiness)
        private readonly businessRepository: Repository<WhatsAppBusiness>,
        private readonly clientService: ThusoClientProxiesService

    ) {
        this.logger = this.loggingService.getLogger({
            module: "businesses",
            file: "businesses.rmq.service"
        })

        this.logger.info("Initialised Business Rmq Service")
    }
}