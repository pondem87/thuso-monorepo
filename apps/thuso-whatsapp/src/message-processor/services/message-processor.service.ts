import { LoggingService } from '@lib/logging';
import { MessageProcessorRMQMessage } from '@lib/thuso-common/message-queue-types';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Logger } from 'winston';
import { MessageProcessorAccountData } from '../entities/account-data.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { isDateLessThanHoursOld } from '@lib/thuso-common';

@Injectable()
export class MessageProcessorService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @InjectRepository(MessageProcessorAccountData)
        private readonly accountDataRepo: Repository<MessageProcessorAccountData>,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "message-processor.service"
        })

        this.logger.info("Message Processor service initialized.")
    }

    async processNoContactsMessage(payload: MessageProcessorRMQMessage) {
        throw new Error('Method not implemented.');
    }

    async processMessage(payload: MessageProcessorRMQMessage) {
        // check acount data
        let accountData = await this.accountDataRepo.findOneBy({ phoneNumberId: payload.metadata.phone_number_id })

        if (!accountData) {
            // create account data
            const busApiResult = await fetch(
                `${this.configService.get<string>("")}:${this.configService.get<string>("")}/api/businesses/phone-number/${payload.metadata.phone_number_id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("")}`
                    }
                }
            )

            if (!busApiResult.ok) {
                // handle error
            }

            const businessInfo = await busApiResult.json() as BusinessInfo

            accountData = await this.accountDataRepo.save(
                this.accountDataRepo.create({
                    phoneNumberId: payload.metadata.phone_number_id,
                    accountId: businessInfo.accountId,
                    wabaId: businessInfo.wabaId,
                    wabaToken: businessInfo.wabaToken,
                    businessName: businessInfo.businessProfile.name,
                    tagline: businessInfo.businessProfile.tagline,
                    serviceDescription: businessInfo.businessProfile.serviceDescription,
                    about: businessInfo.businessProfile.about,
                    disabled: false
                })
            )

            // update account data
            const accApiResult = await fetch(
                `${this.configService.get<string>("")}:${this.configService.get<string>("")}/api/accounts/${accountData.accountId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("")}`
                    }
                }
            )

            if (!accApiResult.ok) {
                // handle error
            }

            const account = await accApiResult.json() as Account

            accountData.subscriptionEndDate = account.subscriptionEndDate
            accountData.disabled = account.disabled

            await this.accountDataRepo.save(accountData)
        }

        if (!isDateLessThanHoursOld(accountData.updatedAt, 6)) {
            // if account-data stale, refress
            // create account data
            const busApiResult = await fetch(
                `${this.configService.get<string>("")}:${this.configService.get<string>("")}/api/businesses/phone-number/${payload.metadata.phone_number_id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("")}`
                    }
                }
            )

            if (!busApiResult.ok) {
                // handle error
                this.logger.warn("Failed to get business info", { response: await busApiResult.json() })
            } else {
                const businessInfo = await busApiResult.json() as BusinessInfo
                accountData.accountId = businessInfo.accountId
                accountData.wabaId = businessInfo.wabaId
                accountData.wabaToken = businessInfo.wabaToken
                accountData.businessName = businessInfo.businessProfile.name
                accountData.tagline = businessInfo.businessProfile.tagline
                accountData.serviceDescription = businessInfo.businessProfile.serviceDescription
                accountData.about = businessInfo.businessProfile.about
                accountData.disabled = businessInfo.disabled
            }

            // update account data
            const accApiResult = await fetch(
                `${this.configService.get<string>("")}:${this.configService.get<string>("")}/api/accounts/${accountData.accountId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("")}`
                    }
                }
            )

            if (!accApiResult.ok) {
                // handle error
                this.logger.warn("", { response: await busApiResult.json() })
            } else {
                const account = await accApiResult.json() as Account
                accountData.subscriptionEndDate = account.subscriptionEndDate
                accountData.disabled = account.disabled
            }

            accountData = await this.accountDataRepo.save(accountData)
        }

        if (accountData.disabled || !accountData.subscriptionEndDate || accountData.subscriptionEndDate < new Date()) {
            // no active subscription
        }

        // process message
        
    }
}

type Account = {
    id: string
    name: string
    disabled: boolean
    subscriptionEndDate: Date
    createdAt: Date
}

type BusinessProfile = {
    id: string
    accountId: string
    name: string
    tagline: string
    serviceDescription: string
    about: string
    imageLogoId: string
    imageBannerId: string
}

type BusinessInfo = {
    id: string
    accountId: string
    wabaId: string
    name: string
    wabaToken: string
    subscribed: boolean
    disabled: boolean
    businessProfile: BusinessProfile
    createdAt: Date
}
