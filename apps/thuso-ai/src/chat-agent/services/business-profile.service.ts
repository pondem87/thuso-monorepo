import { LoggingService } from '@lib/logging';
import { BusinessProfileUpdatePayload, isDateLessThanHoursOld, WhatsAppBusinessUpdatePayload } from '@lib/thuso-common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from 'winston';
import { BusinessProfile } from '../entities/business-profile.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BusinessProfileService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @InjectRepository(BusinessProfile)
        private readonly businessProfileRepo: Repository<BusinessProfile>,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "business-profile",
            file: "business-profile.service"
        })

        this.logger.info("Initialised BusinessProfileService")
    }

    async getBusinessProfileByWabaId(wabaId: string): Promise<BusinessProfile> {
        let businessProfile = await this.businessProfileRepo.findOne({ where: { wabaId } })

        if (!businessProfile) {
            // Create a new business profile
            const businessData = await this.fetchProfileData(wabaId)
            if (!businessData) return null

            businessProfile = await this.businessProfileRepo.save(
                this.businessProfileRepo.create({
                    wabaId: businessData.wabaId,
                    accountId: businessData.accountId,
                    profileId: businessData.businessProfile?.id,
                    botname: businessData.businessProfile?.botname,
                    name: businessData.businessProfile?.name,
                    tagline: businessData.businessProfile?.tagline,
                    serviceDescription: businessData.businessProfile?.serviceDescription,
                    about: businessData.businessProfile?.about,
                    imageLogoId: businessData.businessProfile?.imageLogoId,
                    imageBannerId: businessData.businessProfile?.imageBannerId
                })
            )
        } else if (!isDateLessThanHoursOld(businessProfile.updatedAt, parseInt(this.configService.get<string>("AI_BUSINESS_DATA_DURATION_HOURS")) || 2) || !businessProfile.profileId) {
            // Update the business profile
            const businessData = await this.fetchProfileData(wabaId)
            if (!businessData) return null

            businessProfile.profileId = businessData.businessProfile?.id
            businessProfile.botname = businessData.businessProfile?.botname
            businessProfile.name = businessData.businessProfile?.name
            businessProfile.tagline = businessData.businessProfile?.tagline
            businessProfile.serviceDescription = businessData.businessProfile?.serviceDescription
            businessProfile.about = businessData.businessProfile?.about
            businessProfile.imageLogoId = businessData.businessProfile?.imageLogoId
            businessProfile.imageBannerId = businessData.businessProfile?.imageBannerId

            businessProfile = await this.businessProfileRepo.save(businessProfile)
        }

        return businessProfile
    }

    async fetchProfileData(wabaId: string): Promise<BusinessInfoType> {
        try {
            const busApiResult = await fetch(
                `http://${this.configService.get<string>("MANAGEMENT_SERVER_URL")}:${this.configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/businesses/${wabaId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`
                    }
                }
            )

            if (!busApiResult.ok) {
                this.logger.error("Failed to get business profile", { wabaId, response: busApiResult })
                return null
            }

            return await busApiResult.json() as BusinessInfoType
        } catch (error) {
            this.logger.error("Failed to get business profile", { wabaId, error })
            return null
        }
    }

    async processProfileUpdateService(data: BusinessProfileUpdatePayload) {
        try {
            const wabaId = data.businessProfileData.waba?.id
            if(!wabaId) {
                return
            }

            let businessProfile = await this.businessProfileRepo.findOne({ where: { wabaId } })

            if (!businessProfile) {
                // Create a new business profile
                const businessData = data.businessProfileData.waba
                businessData.businessProfile = data.businessProfileData

                businessProfile = await this.businessProfileRepo.save(
                    this.businessProfileRepo.create({
                        wabaId: businessData.wabaId,
                        accountId: businessData.accountId,
                        profileId: businessData.businessProfile?.id,
                        botname: businessData.businessProfile?.botname,
                        name: businessData.businessProfile?.name,
                        tagline: businessData.businessProfile?.tagline,
                        serviceDescription: businessData.businessProfile?.serviceDescription,
                        about: businessData.businessProfile?.about,
                        imageLogoId: businessData.businessProfile?.imageLogoId,
                        imageBannerId: businessData.businessProfile?.imageBannerId
                    })
                )
            } else {
                // Update the business profile
                const businessData = data.businessProfileData.waba
                businessData.businessProfile = data.businessProfileData

                businessProfile.profileId = businessData.businessProfile?.id
                businessProfile.botname = businessData.businessProfile?.botname
                businessProfile.name = businessData.businessProfile?.name
                businessProfile.tagline = businessData.businessProfile?.tagline
                businessProfile.serviceDescription = businessData.businessProfile?.serviceDescription
                businessProfile.about = businessData.businessProfile?.about
                businessProfile.imageLogoId = businessData.businessProfile?.imageLogoId
                businessProfile.imageBannerId = businessData.businessProfile?.imageBannerId

                businessProfile = await this.businessProfileRepo.save(businessProfile)
            }
        } catch (error) {
            this.logger.error("Error while processing business profile update message", { error })
        }
    }

    async processBusinessUpdate(data: WhatsAppBusinessUpdatePayload) {
        try {
            let businessProfile = await this.businessProfileRepo.findOne({ where: { wabaId: data.businessData.wabaId } })

            if (!businessProfile) {
                // Create a new business profile
                const businessData = data.businessData

                businessProfile = await this.businessProfileRepo.save(
                    this.businessProfileRepo.create({
                        wabaId: businessData.wabaId,
                        accountId: businessData.accountId,
                        profileId: businessData.businessProfile?.id,
                        botname: businessData.businessProfile?.botname,
                        name: businessData.businessProfile?.name,
                        tagline: businessData.businessProfile?.tagline,
                        serviceDescription: businessData.businessProfile?.serviceDescription,
                        about: businessData.businessProfile?.about,
                        imageLogoId: businessData.businessProfile?.imageLogoId,
                        imageBannerId: businessData.businessProfile?.imageBannerId
                    })
                )
            } else {
                // Update the business profile
                const businessData = data.businessData

                businessProfile.profileId = businessData.businessProfile?.id
                businessProfile.botname = businessData.businessProfile?.botname
                businessProfile.name = businessData.businessProfile?.name
                businessProfile.tagline = businessData.businessProfile?.tagline
                businessProfile.serviceDescription = businessData.businessProfile?.serviceDescription
                businessProfile.about = businessData.businessProfile?.about
                businessProfile.imageLogoId = businessData.businessProfile?.imageLogoId
                businessProfile.imageBannerId = businessData.businessProfile?.imageBannerId

                businessProfile = await this.businessProfileRepo.save(businessProfile)
            }
        } catch (error) {
            this.logger.error("Error while processing business update message", { error })
        }
    }
}

type BusinessProfileType = {
    id: string
    accountId: string
    botname: string
    name: string
    tagline: string
    serviceDescription: string
    about: string
    imageLogoId: string
    imageBannerId: string
}

type BusinessInfoType = {
    id: string
    accountId: string
    wabaId: string
    name: string
    wabaToken: string
    subscribed: boolean
    disabled: boolean
    businessProfile?: BusinessProfileType
    createdAt: Date
}