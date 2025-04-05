import { LoggingService } from "@lib/logging";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Logger } from "winston";
import { MessageProcessorAccountData } from "../entities/account-data.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { isDateLessThanHoursOld } from "@lib/thuso-common";

@Injectable()
export class AccountDataService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService,
        @InjectRepository(MessageProcessorAccountData)
        private readonly accountDataRepo: Repository<MessageProcessorAccountData>,
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "account-data.service"
        })

        this.logger.info("Account Data service initialized.")
    }

    async getAccountData(wabaId: string, phone_number_id: string): Promise<MessageProcessorAccountData> {
        try {
            let accountData = await this.accountDataRepo.findOne({ where: { wabaId, phoneNumberId: phone_number_id } })

            if (!accountData) {
                // create account data
                const busApiResult = await fetch(
                    `http://${this.configService.get<string>("MANAGEMENT_SERVER_URL")}:${this.configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/businesses/phone-number/${phone_number_id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`
                        }
                    }
                )

                if (!busApiResult.ok) {
                    // handle error
                    this.logger.error("Failed to get business info", { response: await busApiResult.json() })
                    return null
                }

                const businessInfo = await busApiResult.json() as BusinessInfo

                accountData = await this.accountDataRepo.save(
                    this.accountDataRepo.create({
                        phoneNumberId: phone_number_id,
                        accountId: businessInfo.accountId,
                        wabaId: businessInfo.wabaId,
                        wabaToken: businessInfo.wabaToken,
                        businessName: businessInfo.businessProfile?.name,
                        tagline: businessInfo.businessProfile?.tagline,
                        serviceDescription: businessInfo.businessProfile?.serviceDescription,
                        about: businessInfo.businessProfile?.about,
                        disabled: false
                    })
                )

                // update account data
                const accApiResult = await fetch(
                    `http://${this.configService.get<string>("MANAGEMENT_SERVER_URL")}:${this.configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/accounts/${accountData.accountId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`
                        }
                    }
                )

                if (!accApiResult.ok) {
                    // handle error
                    this.logger.error("Failed to get account info", { response: await accApiResult.json() })
                } else {
                    const account = await accApiResult.json() as AccountInfo
                    accountData.subscriptionEndDate = account.subscriptionEndDate
                    accountData.disabled = account.disabled
                }

                accountData = await this.accountDataRepo.save(accountData)
            } else if (!isDateLessThanHoursOld(accountData.updatedAt, parseInt(this.configService.get<string>("MESSAGE_PROCESSOR_ACCOUNT_DATA_DURATION_HOURS")) || 6) || !accountData.businessName ) {
                // if account-data stale, refresh
                // get business data
                const busApiResult = await fetch(
                    `http://${this.configService.get<string>("MANAGEMENT_SERVER_URL")}:${this.configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/businesses/phone-number/${phone_number_id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`
                        }
                    }
                )

                if (!busApiResult.ok) {
                    // handle error
                    this.logger.warn("Failed to get business info for update", { response: await busApiResult.json() })
                } else {
                    const businessInfo = await busApiResult.json() as BusinessInfo
                    accountData.accountId = businessInfo.accountId
                    accountData.wabaId = businessInfo.wabaId
                    accountData.wabaToken = businessInfo.wabaToken
                    accountData.businessName = businessInfo.businessProfile?.name 
                    accountData.tagline = businessInfo.businessProfile?.tagline
                    accountData.serviceDescription = businessInfo.businessProfile?.serviceDescription
                    accountData.about = businessInfo.businessProfile?.about
                    accountData.disabled = businessInfo.disabled
                }

                // get account data
                const accApiResult = await fetch(
                    `http://${this.configService.get<string>("MANAGEMENT_SERVER_URL")}:${this.configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/accounts/${accountData.accountId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`
                        }
                    }
                )

                if (!accApiResult.ok) {
                    // handle error
                    this.logger.warn("Failed to get account data for update", { response: await busApiResult.json() })
                } else {
                    const account = await accApiResult.json() as AccountInfo
                    accountData.subscriptionEndDate = account.subscriptionEndDate
                    accountData.disabled = account.disabled
                }

                accountData = await this.accountDataRepo.save(accountData)
            }

            return accountData
        } catch (error) {
            this.logger.error("Failed to get account data", { wabaId, phone_number_id, error })
            return null
        }
    }
}

type AccountInfo = {
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
    businessProfile?: BusinessProfile
    createdAt: Date
}