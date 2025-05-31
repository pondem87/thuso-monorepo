import { LoggingService } from "@lib/logging"
import { Injectable } from "@nestjs/common"
import { WhatsAppBusiness } from "../entities/whatsapp-business.entity"
import { InjectRepository } from "@nestjs/typeorm"
import { Logger } from "winston"
import { Repository } from "typeorm"
import { CustomerRegistrationChatAgentEventPattern, CustomerRegistrationChatAgentEventPayload, NewCustomerBusinessEventPayload } from "@lib/thuso-common"
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
    
    async processNewCustomer(payload: NewCustomerBusinessEventPayload) {
        try {
            const businesses = await this.businessRepository.find({ where: { accountId: payload.accountId }, relations: { appNumbers: true }})
            for (const business of businesses) {
                if (payload.initiator === "AI") {
                    this.clientService.emitLlmQueue(
                        CustomerRegistrationChatAgentEventPattern,
                        {
                            crmId: payload.crmId,
                            fullname: payload.fullname,
                            whatsAppNumber: payload.whatsAppNumber,
                            wabaId: business.wabaId
                        } as CustomerRegistrationChatAgentEventPayload
                    )
                } else if (payload.initiator === "USER") {
                    this.clientService.emitLlmQueue(
                        CustomerRegistrationChatAgentEventPattern,
                        {
                            crmId: payload.crmId,
                            fullname: payload.fullname,
                            whatsAppNumber: payload.whatsAppNumber,
                            wabaId: business.wabaId,
                            phone_number_id: business.appNumbers.map(num => num.appNumberId)
                        } as CustomerRegistrationChatAgentEventPayload
                    )
                }
            }
        } catch (error) {
            this.logger.error("Error while gathering info for new customer registration", { error })
        }
    }
}