import { LoggingService } from "@lib/logging"
import { HttpException, HttpStatus, Injectable } from "@nestjs/common"
import { WhatsAppBusiness } from "../entities/whatsapp-business.entity"
import { InjectRepository } from "@nestjs/typeorm"
import { Logger } from "winston"
import { Repository } from "typeorm"

/*
 * Service methods for inter-service functionality related to WhatsApp Business accounts.
*/
@Injectable()
export class BusinessesApiService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @InjectRepository(WhatsAppBusiness)
        private readonly businessRepository: Repository<WhatsAppBusiness>,
        
    ) {
        this.logger = this.loggingService.getLogger({
            module: "businesses",
            file: "businesses.api.service"
        })

        this.logger.info("Initialise Business Api Service")
    }

    async getBusinessInfoByPhoneNumberId(phoneNumberId: string) {
        try {
            return await this.businessRepository.findOneOrFail({
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

    async getBusinessInfoByWabaId(wabaId: string) {
        try {
            return await this.businessRepository.findOne({
                where: { 
                    wabaId
                },
                relations: {
                    businessProfile: true,
                }
            })
        } catch (error) {
            this.logger.error("Error while getting business information by wabaid", { wabaId,  error })
            throw new HttpException("Failed to get business info", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getBusinessProfileByWabaId(wabaId: string) {
        return await this.businessRepository.findOne({
            where: { 
                wabaId
            },
            relations: {
                businessProfile: true,
            }
        }).then((business) => {
            if (!business || !business.businessProfile) {
                throw new HttpException("Business or Profile not found", HttpStatus.NOT_FOUND)
            }
            return business.businessProfile
        }).catch((error) => {
            this.logger.error("Error while getting business profile by wabaid", { wabaId,  error })
            throw new HttpException("Failed to get business profile", HttpStatus.INTERNAL_SERVER_ERROR)
        })
    }
}