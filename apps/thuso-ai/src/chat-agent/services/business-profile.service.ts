import { LoggingService } from '@lib/logging';
import { isDateLessThanHoursOld } from '@lib/thuso-common';
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
            const profileData = await this.fetchProfileData(wabaId)
            if (!profileData) return null

            businessProfile = await this.businessProfileRepo.save(
                this.businessProfileRepo.create({
                    accountId: profileData.accountId,
                    profileId: profileData.id,
                    name: profileData.businessProfile.name,
                    tagline: profileData.businessProfile.tagline,
                    serviceDescription: profileData.businessProfile.serviceDescription,
                    about: profileData.businessProfile.about,
                    imageLogoId: profileData.businessProfile.imageLogoId,
                    imageBannerId: profileData.businessProfile.imageBannerId
                })
            )
        }

        if (!isDateLessThanHoursOld(businessProfile.updatedAt, parseInt(this.configService.get<string>("AI_BUSINESS_DATA_DURATION_HOURS")) || 2)) {
            // Update the business profile
            const profileData = await this.fetchProfileData(wabaId)
            if (!profileData) return null

            businessProfile.profileId = profileData.id,
            businessProfile.name = profileData.businessProfile.name,
            businessProfile.tagline = profileData.businessProfile.tagline,
            businessProfile.serviceDescription = profileData.businessProfile.serviceDescription,
            businessProfile.about = profileData.businessProfile.about,
            businessProfile.imageLogoId = profileData.businessProfile.imageLogoId,
            businessProfile.imageBannerId = profileData.businessProfile.imageBannerId

            businessProfile = await this.businessProfileRepo.save(businessProfile)
        }

        return businessProfile
    }

    async fetchProfileData(wabaId: string): Promise<BusinessInfoType> {
        try {
            const busApiResult = await fetch(
                `${this.configService.get<string>("MANAGEMENT_SERVER_URL")}:${this.configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/businesses/${wabaId}`,
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
}

type BusinessProfileType = {
    id: string
    accountId: string
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
    businessProfile: BusinessProfileType
    createdAt: Date
}

