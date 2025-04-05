import { LoggingService } from '@lib/logging';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
import { MessengerWhatsAppBusiness } from '../entities/whatsapp-business.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isDateLessThanHoursOld } from '@lib/thuso-common';
import { MessengerAccount } from '../entities/account.entity';

@Injectable()
export class WhatsAppBusinessService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService,
        @InjectRepository(MessengerWhatsAppBusiness)
        private readonly whatsAppBusinessRepo: Repository<MessengerWhatsAppBusiness>,
        @InjectRepository(MessengerAccount)
        private readonly accountRepo: Repository<MessengerAccount>
    ) {
        this.logger = this.loggingService.getLogger({
            module: "messenger",
            file: "whatsapp-business.service"
        })

        this.logger.info("Initialised WhatsAppBusinessService")
    }

    async getBusinessInfo(wabaId: string): Promise<MessengerWhatsAppBusiness> {
        let business = await this.whatsAppBusinessRepo.findOne({ where: { wabaId } })

        if (!business) {
            const busInfo = await this.fetchBusinessData(wabaId)
            if (!busInfo) return null

            const account = await this.getAccountInfo(busInfo.accountId)
            if (!account) return null

            business = await this.whatsAppBusinessRepo.save(
                this.whatsAppBusinessRepo.create({
                    wabaId: busInfo.wabaId,
                    wabaToken: busInfo.wabaToken,
                    profileName: busInfo.businessProfile?.name,
                    tagLine: busInfo.businessProfile?.tagline,
                    account 
                })
            )
        } else if (!isDateLessThanHoursOld(business.updatedAt, parseInt(this.configService.get<string>("MESSENGER_BUSINESS_DATA_DURATION_HOURS")) || 2) || !business.profileName) {
            const busInfo = await this.fetchBusinessData(wabaId)
            if (!busInfo) return null

            business.wabaId = busInfo.wabaId
            business.wabaToken = busInfo.wabaToken
            business.profileName = busInfo.businessProfile?.name,
            business.tagLine = busInfo.businessProfile?.tagline,

            business = await this.whatsAppBusinessRepo.save(business)
        }

        return business
    }

    async fetchBusinessData(wabaId: string): Promise<BusinessInfoType> {
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

    async getAccountInfo(accountId: string): Promise<MessengerAccount> {
        let account = await this.accountRepo.findOne({ where: { id: accountId } })

        if (!account) {
            const accInfo = await this.fetchAccountData(accountId)
            if (!accInfo) return null

            account = await this.accountRepo.save(
                this.accountRepo.create({
                    id: accInfo.id,
                    maxAllowedDailyConversations: accInfo.maxAllowedDailyConversations,
                    disabled: accInfo.disabled,
                    subscriptionEndDate: accInfo.subscriptionEndDate
                })
            )
        }

        if (!isDateLessThanHoursOld(account.updatedAt, parseInt(this.configService.get<string>("MESSENGER_ACCOUNT_DATA_DURATION_HOURS")) || 12)) {
            const accInfo = await this.fetchAccountData(accountId)
            if (!accInfo) return null

            account.id = accInfo.id
            account.maxAllowedDailyConversations = accInfo.maxAllowedDailyConversations
            account.disabled = accInfo.disabled
            account.subscriptionEndDate = accInfo.subscriptionEndDate

            account = await this.accountRepo.save(account)
        }

        return account
    }

    async fetchAccountData(accountId: string): Promise<AccountInfoType> {
        try {
            const accApiResult = await fetch(
                `http://${this.configService.get<string>("MANAGEMENT_SERVER_URL")}:${this.configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/accounts/${accountId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`
                    }
                }
            )

            if (!accApiResult.ok) {
                this.logger.error("Failed to get account", { accountId, response: accApiResult })
                return null
            }

            return await accApiResult.json() as AccountInfoType
        } catch (error) {
            this.logger.error("Failed to get account", { accountId, error })
            return null
        }
    }

    async getAccountByWabaId(wabaId: string): Promise<MessengerAccount> {
        try {
            return await this.accountRepo.findOne({ where: { wabas: { wabaId } }, relations: { wabas: true } })
        } catch (error) {
            this.logger.error("Failed to get account by wabaId", { wabaId, error })
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

type AccountInfoType = {
    id: string
    name: string
    maxAllowedBusinesses: number
    maxAllowedDailyConversations: number
    disabled: boolean
    subscriptionEndDate: Date
    createdAt: Date
}
