import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoggingService } from '@lib/logging';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { DeleteResult, EntityNotFoundError, Repository } from 'typeorm';
import { generateRandomString } from '@lib/thuso-common';
import { WhatsAppBusiness } from '../entities/whatsapp-business.entity';
import { WhatsAppNumber } from '../entities/whatsapp-number';
import { Account } from '../../accounts/entities/account.entity';
import { CreateBusinessProfileDto } from '../dto/create-business-profile.dto';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { WhatsAppBusinessDto, WhatsAppNumberDto, BusinessProfileDto } from '../dto/response-dtos.dto';
import { UpdateBusinessProfileDto } from '../dto/update-business-profile.dto';
import { BusinessProfile } from '../entities/business-profile.entity';

@Injectable()
export class BusinessesService {
    private logger: Logger

    constructor(
        @InjectRepository(WhatsAppBusiness)
        private readonly whatsappBusinessRepository: Repository<WhatsAppBusiness>,
        @InjectRepository(WhatsAppNumber)
        private readonly whatsappNumberRepository: Repository<WhatsAppNumber>,
        @InjectRepository(BusinessProfile)
        private readonly businessProfileRepository: Repository<BusinessProfile>,
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "businesses",
            file: "businesses.service"
        })

        this.logger.info("Businesses service created")
    }

    async createWhatsAppBusiness(accountId: string, data: CreateBusinessDto) {
        // Get business token from meta
        try {
            const accessTokenUrlRoot = `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/oauth/access_token`
            const clientId = this.configService.get<string>("META_APP_ID")
            const clientSecret = this.configService.get<string>("META_APP_SECRET")
            const code = data.exchangeToken
            const accessTokenUrl = `${accessTokenUrlRoot}?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`

            const businessTokenResponse = await fetch(accessTokenUrl)

            if (!businessTokenResponse.ok) {
                this.logger.error("Failed to retrieve business token", { accountId, response: await businessTokenResponse.json() })
                throw new Error(`Failed to retrieve business token: ${JSON.stringify(await businessTokenResponse.json())}`)
            }

            const businessToken = await businessTokenResponse.text()

            // if we get a business token we then create resources
            let business = await this.whatsappBusinessRepository.findOne({ where: { accountId, wabaId: data.wabaId }, relations: { appNumbers: true } })
            if (!business) {
                // check if max business accounts reached
                const account = await this.accountRepository.findOneBy({ id: accountId })
                const [_, numOfBusinesses] = await this.whatsappBusinessRepository.findAndCount({ where: { accountId } })

                if (numOfBusinesses >= account.maxAllowedBusinesses) {
                    return {
                        error: "You have exceeded maximum number of businesses!"
                    }
                }

                business = await this.whatsappBusinessRepository.save(
                    this.whatsappBusinessRepository.create({
                        accountId,
                        wabaId: data.wabaId,
                        wabaToken: businessToken
                    })
                )
            }

            let appNumber = await this.whatsappNumberRepository.findOne({ where: { accountId, appNumberId: data.phoneNumberId } })
            if (!appNumber) {
                // check if max allowed numbers achieved
                if (business.appNumbers && business.appNumbers.length >= 2) {
                    return {
                        error: "You have reached the maximum number of phone numbers!"
                    }
                }

                appNumber = await this.whatsappNumberRepository.save(
                    this.whatsappNumberRepository.create({
                        accountId,
                        appNumberId: data.phoneNumberId,
                        pin: generateRandomString(6, "numeric"),
                        waba: business
                    })
                )
            }

            // subscribe to the business webhooks
            const subscribeResponse = await fetch(
                `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/${business.wabaId}/subscribed_apps`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${business.wabaToken}`
                    }
                }
            )

            if (subscribeResponse.ok) {
                const subscribed = (await subscribeResponse.json()).success

                if (subscribed) {
                    business.subscribed = true
                    business = await this.whatsappBusinessRepository.save(business)
                }
            } else {
                this.logger.warn("Failed to subscribe to WABA", { waba_id: business.wabaId, response: await subscribeResponse.json(), status_code: subscribeResponse.status })
            }

            // register phone number
            const registerResponse = await fetch(
                `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/${appNumber.appNumberId}/register`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${business.wabaToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        pin: appNumber.pin
                    })
                }
            )

            if (registerResponse.ok) {
                const registered = (await registerResponse.json()).success

                if (registered) {
                    appNumber.registered = true
                    appNumber = await this.whatsappNumberRepository.save(appNumber)
                }
            } else {
                this.logger.warn("Failed to register WhatsApp", { waba_id: business.wabaId, phone_number_id: appNumber.appNumberId, response: await registerResponse.json(), status_code: registerResponse.status })
            }

            return {
                waba: new WhatsAppBusinessDto(business),
                appNumber: new WhatsAppNumberDto(appNumber)
            }

        } catch (error) {
            this.logger.error("Error while creating WhatsApp Business", { accountId, error })
            throw new HttpException("Error while creating WhatsApp Business", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getDisplayNumber(accountId: string, id: string): Promise<WhatsAppNumberDto> {
        try {
            const appNumber = await this.whatsappNumberRepository.findOne({ where: { accountId, id }, relations: { waba: true } })

            const displayNumberResponse = await fetch(
                `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/${appNumber.waba.wabaId}/phone_numbers`,
                {
                    headers: {
                        "Authorization": `Bearer ${appNumber.waba.wabaToken}`
                    }
                }
            )

            if (!displayNumberResponse.ok) {
                this.logger.error("Failed to get display number", { accountId, numberId: id, response: await displayNumberResponse.json() })
                throw new Error(`Failed to get display number: ${JSON.stringify(await displayNumberResponse.json())}`)
            }

            const wabaNumbers = (await displayNumberResponse.json()).data
            const thisWabaNumber = wabaNumbers.find((number) => number.id === appNumber.appNumberId)

            // RESPONSE EXAMPLE
            // {
            //     "data": [
            //         {
            //             "verified_name": "Pfitztronic's Medulla",
            //             "code_verification_status": "EXPIRED",
            //             "display_phone_number": "+267 77 084 294",
            //             "quality_rating": "GREEN",
            //             "platform_type": "CLOUD_API",
            //             "throughput": {
            //                 "level": "STANDARD"
            //             },
            //             "webhook_configuration": {
            //                 "application": "https://api.medullav2.pfitz.co.zw/whatsapp-webhook"
            //             },
            //             "id": "326607507206446"
            //         }
            //     ],
            //     "paging": {
            //         "cursors": {
            //             "before": "QVFIUnZArQU9nbXI0YUc0aDBValFFSTc5VE5ldGZAEVjdnaEpmamU4WlJmclM3V2w0RDEyS2k5N0l1cGhXTEdKYUdhbFcZD",
            //             "after": "QVFIUnZArQU9nbXI0YUc0aDBValFFSTc5VE5ldGZAEVjdnaEpmamU4WlJmclM3V2w0RDEyS2k5N0l1cGhXTEdKYUdhbFcZD"
            //         }
            //     }
            // }

            appNumber.appNumber = thisWabaNumber.display_phone_number as string

            return new WhatsAppNumberDto(await this.whatsappNumberRepository.save(appNumber))

        } catch (error) {
            this.logger.error("Error while getting display number", { accountId, error: JSON.stringify(error) })
            throw new HttpException("Error while getting display number", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getBusinessName(accountId: string, id: string): Promise<WhatsAppBusinessDto> {
        try {
            const business = await this.whatsappBusinessRepository.findOne({ where: { accountId, id } })

            const businessNameResponse = await fetch(
                `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/${business.wabaId}`,
                {
                    headers: {
                        "Authorization": `Bearer ${business.wabaToken}`
                    }
                }
            )

            if (!businessNameResponse.ok) {
                this.logger.error("Failed to get business name", { accountId, businessId: id, response: await businessNameResponse.json() })
                throw new Error(`Failed to get business name: ${JSON.stringify(await businessNameResponse.json())}`)
            }

            const businessData = await businessNameResponse.json()

            // RESPONSE EXAMPLE
            // {
            //     "id": "336894872842054",
            //     "name": "Pfitztronic",
            //     "currency": "USD",
            //     "timezone_id": "141",
            //     "message_template_namespace": "f06116ff_f622_4f4e_83c6_7fa9939a7070"
            // }

            business.name = businessData.name as string

            return new WhatsAppBusinessDto(await this.whatsappBusinessRepository.save(business))
        } catch (error) {
            this.logger.error("Error while getting display number", { accountId, error: JSON.stringify(error) })
            throw new HttpException("Error while getting display number", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async registerAppNumber(accountId: string, id: string) {
        try {
            const appNumber = await this.whatsappNumberRepository.findOne({ where: { accountId, id }, relations: { waba: true } })
            // register phone number
            const registerResponse = await fetch(
                `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/${appNumber.appNumberId}/register`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${appNumber.waba.wabaToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        messaging_product: "whatsapp",
                        pin: appNumber.pin
                    })
                }
            )

            if (!registerResponse.ok) {
                this.logger.error("Failed to register number", { accountId, numberId: id, response: await registerResponse.json() })
                throw new Error(`Failed to register number: ${JSON.stringify(await registerResponse.json())}`)
            }

            const result = await registerResponse.json()
            appNumber.registered = result.success
            await this.whatsappBusinessRepository.save(appNumber)

            return result as { success: boolean }
        } catch (error) {
            this.logger.error("Failed to register number", { accountId, numberId: id, error: JSON.stringify(error) })
            throw new HttpException("Failed to register number", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async subscribeBusiness(accountId: string, id: string) {
        try {
            const business = await this.whatsappBusinessRepository.findOneBy({ accountId, id })
            // subscribe to the business webhooks
            const subscribeResponse = await fetch(
                `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/${business.wabaId}/subscribed_apps`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${business.wabaToken}`
                    }
                }
            )

            if (!subscribeResponse.ok) {
                this.logger.error("Failed to subscribe WABA", { accountId, businessId: id, response: await subscribeResponse.json() })
                throw new Error(`Failed to subscribe WABA: ${JSON.stringify(await subscribeResponse.json())}`)
            }

            const result = await subscribeResponse.json()
            business.subscribed = result.success
            await this.whatsappBusinessRepository.save(business)

            return result as { success: boolean }
        } catch (error) {
            this.logger.error("Failed to subscribe WABA", { accountId, businessId: id, error: JSON.stringify(error) })
            throw new HttpException("Failed to subscribe WABA", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getBusiness(accountId: string, id: string): Promise<WhatsAppBusinessDto> {
        try {
            return new WhatsAppBusinessDto(await this.whatsappBusinessRepository.findOneOrFail({ where: { accountId, id }, relations: { businessProfile: true, appNumbers: true } }))
        } catch (error) {
            // Check if the error is due to the entity not being found
            if (error instanceof EntityNotFoundError) {
                this.logger.error("Business not found", { accountId, error });
                throw new HttpException("Business not found", HttpStatus.NOT_FOUND);
            }

            this.logger.error("Error while getting business", { accountId, error: JSON.stringify(error) })
            throw new HttpException("Error while getting business", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getBusinesses(accountId: string): Promise<WhatsAppBusinessDto[]> {
        try {
            return (await this.whatsappBusinessRepository.find({ where: { accountId }, relations: { businessProfile: true } })).map((business) => new WhatsAppBusinessDto(business))
        } catch (error) {
            this.logger.error("Error while getting businesses", { accountId, error: JSON.stringify(error) })
            throw new HttpException("Error while getting businesses", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async deleteAppNumber(accountId: string, id: string) {
        try {
            return await this.whatsappNumberRepository.delete({ accountId, id })
        } catch (error) {
            this.logger.error("Failed to delete whatsapp number", { accountId, numberId: id, error })
            throw new HttpException("Error while deleting phone number", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async deleteBusiness(accountId: string, id: string): Promise<DeleteResult> {
        try {
            await this.whatsappNumberRepository.delete({ accountId, waba: { id } })
            return await this.whatsappBusinessRepository.delete({ accountId, id })
        } catch (error) {
            this.logger.error("Error while deleting business", { accountId, error: JSON.stringify(error) })
            throw new HttpException("Error while deleting business", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async createBusinessProfile(accountId: string, businessId: string, data: CreateBusinessProfileDto): Promise<BusinessProfileDto> {
        try {
            // Verify the business exists with its current profile relations
            const business = await this.whatsappBusinessRepository.findOne({
                where: { accountId, id: businessId },
                relations: { businessProfile: true }
            })

            if (!business) {
                throw new HttpException("Business not found", HttpStatus.NOT_FOUND)
            }

            if (business.businessProfile) {
                throw new HttpException("Business profile already exists", HttpStatus.BAD_REQUEST)
            }

            // Create and save the new business profile
            const businessProfile = await this.businessProfileRepository.save(
                this.businessProfileRepository.create({
                    accountId,
                    ...data
                })
            )

            // Associate the new profile with the business and persist
            business.businessProfile = businessProfile
            await this.whatsappBusinessRepository.save(business)

            // Returning the updated business with profile details
            return new BusinessProfileDto(businessProfile)
        } catch (error) {
            this.logger.error("Error while creating business profile", { accountId, businessId, error: JSON.stringify(error) })
            throw new HttpException("Error while creating business profile", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async updateBusinessProfile(accountId: string, id: string, data: UpdateBusinessProfileDto): Promise<BusinessProfileDto> {
        try {
            const businessProfile = await this.businessProfileRepository.findOne({
                where: { accountId, id },
                relations: { waba: true }
            });

            if (data.businessId) {
                const business = await this.whatsappBusinessRepository.findOneBy({id: data.businessId})
                if (business) businessProfile.waba = business
                delete data.businessId
            }

            const keys = Object.keys(data)
            for (const key of keys) {
                businessProfile[key] = data[key]
            }

            return new BusinessProfileDto(await this.businessProfileRepository.save(businessProfile));
        } catch (error) {
            this.logger.error("Error while updating business profile", { accountId, profileId: id, error: JSON.stringify(error) });
            throw new HttpException("Error while updating business profile", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async reassignBusinessProfile(accountId: string, id: string, businessId: string) {
        try {
            const business = await this.whatsappBusinessRepository.findOne({ where: { accountId, id: businessId }, relations: { businessProfile: true } })
            if (business.businessProfile) {
                return { success: false, error: "Business can have only 1 profile" }
            }

            const businessProfile = await this.businessProfileRepository.findOne({ where: { id } })

            business.businessProfile = businessProfile
            await this.whatsappBusinessRepository.save(business)

            return { success: true }

        } catch (error) {
            this.logger.error("Error while assigning business profile", { accountId, profileId: id, businessId, error: JSON.stringify(error) });
            throw new HttpException("Error while assigning business profile", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getBusinessProfile(accountId: string, id: string): Promise<BusinessProfileDto> {
        try {
            const businessProfile = await this.businessProfileRepository.findOne({
                where: { accountId, id },
                relations: { waba: true }
            });

            return new BusinessProfileDto(businessProfile);
        } catch (error) {
            this.logger.error("Error while getting business profile", { accountId, profileId: id, error: JSON.stringify(error) });
            throw new HttpException("Error while getting business profile", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteBusinessProfile(accountId: string, id: string) {
        try {
            return await this.businessProfileRepository.delete({ accountId, id })
        } catch (error) {
            this.logger.error("Error while deleting profile", { accountId, profileId: id, error: JSON.stringify(error) })
            throw new HttpException("Error while deleting profile", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getBusinessProfiles(accountId: string): Promise<BusinessProfile[]> {
        try {
            return await this.businessProfileRepository.find({ where: { accountId }, relations: { waba: true } })
        } catch (error) {
            this.logger.error("Error while getting profiles", { accountId })
            throw new HttpException("Error while getting profiles", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}
