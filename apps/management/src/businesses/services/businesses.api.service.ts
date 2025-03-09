import { LoggingService } from "@lib/logging"
import { HttpException, HttpStatus, Injectable } from "@nestjs/common"
import { WhatsAppBusiness } from "../entities/whatsapp-business.entity"
import { InjectRepository } from "@nestjs/typeorm"
import { Logger } from "winston"
import { Repository } from "typeorm"

@Injectable()
export class BusinessesApiService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @InjectRepository(WhatsAppBusiness)
        private readonly businessRepository: Repository<WhatsAppBusiness>
    ) {
        this.logger = this.loggingService.getLogger({
            module: "businesses",
            file: "businesses.api.service"
        })
    }

    async getBusinessInfoByPhoneNumberId(phoneNumberId: string) {
        try {
            return await this.businessRepository.findOne({
                where: { 
                    appNumbers: { appNumberId: phoneNumberId }
                },
                relations: {
                    businessProfile: true
                }
            })
        } catch (error) {
            this.logger.error("Error while getting business information by id", { phoneNumberId,  error })
            throw new HttpException("Failed to get business info", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

}