import { LoggingService } from "@lib/logging";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Logger } from "winston";
import { MessageProcessorAccountData } from "../entities/account-data.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { AccountDataUpdatePayload, BusinessProfileUpdatePayload, isDateLessThanHoursOld, WhatsAppBusinessUpdatePayload } from "@lib/thuso-common";

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
                accountData = await this.accountDataRepo.findOne({ where: { wabaId, phoneNumberId: null } })
            }

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
            } else if (!isDateLessThanHoursOld(accountData.updatedAt, parseInt(this.configService.get<string>("MESSAGE_PROCESSOR_ACCOUNT_DATA_DURATION_HOURS")) || 6) || !accountData.businessName || !accountData.phoneNumberId) {
                // if account-data stale, refresh
                // get business data
                const busApiResult1 = await fetch(
                    `http://${this.configService.get<string>("MANAGEMENT_SERVER_URL")}:${this.configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/businesses/phone-number/${phone_number_id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`
                        }
                    }
                )

                const data = await busApiResult1.json()

                if (!busApiResult1.ok) {
                    // handle error
                    this.logger.warn("Failed to get business info for update", { data })
                } else {
                    const businessInfo = data as BusinessInfo
                    accountData.accountId = businessInfo.accountId
                    accountData.phoneNumberId = phone_number_id
                    accountData.wabaId = businessInfo.wabaId
                    accountData.wabaToken = businessInfo.wabaToken
                    accountData.businessName = businessInfo.businessProfile?.name
                    accountData.tagline = businessInfo.businessProfile?.tagline
                    accountData.serviceDescription = businessInfo.businessProfile?.serviceDescription
                    accountData.about = businessInfo.businessProfile?.about
                    accountData.disabled = businessInfo.disabled
                }

                // get account data
                const accApiResult1 = await fetch(
                    `http://${this.configService.get<string>("MANAGEMENT_SERVER_URL")}:${this.configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/accounts/${accountData.accountId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`
                        }
                    }
                )

                if (!accApiResult1.ok) {
                    // handle error
                    this.logger.warn("Failed to get account data for update", { response: await accApiResult1.json() })
                } else {
                    const account = await accApiResult1.json() as AccountInfo
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

    async processProfileUpdate(data: BusinessProfileUpdatePayload) {
        try {
            const wabaId = data.businessProfileData.waba?.wabaId
            if (!wabaId) {
                return
            }
            const accountsData = await this.accountDataRepo.find({ where: { wabaId } })

            if (accountsData.length === 0) {
                const businessInfo = await data.businessProfileData.waba
                businessInfo.businessProfile = data.businessProfileData

                const accountData = await this.accountDataRepo.save(
                    this.accountDataRepo.create({
                        phoneNumberId: null,
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

                if (data.event === "NEW") {
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

                    await this.accountDataRepo.save(accountData)
                }

            } else {
                for (const accountData of accountsData) {
                    const businessInfo = await data.businessProfileData.waba
                    businessInfo.businessProfile = data.businessProfileData

                    accountData.accountId = businessInfo.accountId
                    accountData.wabaId = businessInfo.wabaId
                    accountData.wabaToken = businessInfo.wabaToken
                    accountData.businessName = businessInfo.businessProfile?.name
                    accountData.tagline = businessInfo.businessProfile?.tagline
                    accountData.serviceDescription = businessInfo.businessProfile?.serviceDescription
                    accountData.about = businessInfo.businessProfile?.about
                    accountData.disabled = businessInfo.disabled

                    await this.accountDataRepo.save(accountData)
                } 
            }

        } catch (error) {
            this.logger.error("Error while processing business profile update message", { error, accountId: data.businessProfileData.accountId })
        }
    }

    async processBusinessUpdate(data: WhatsAppBusinessUpdatePayload) {
        try {
            const accountsData = await this.accountDataRepo.find({ where: { wabaId: data.businessData.wabaId } })

            if (accountsData.length === 0) {
                const businessInfo = await data.businessData

                const accountData = await this.accountDataRepo.save(
                    this.accountDataRepo.create({
                        phoneNumberId: null,
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

                if (data.event === "NEW") {
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

                    await this.accountDataRepo.save(accountData)
                }

            } else {
                for (const accountData of accountsData) {
                    const businessInfo = await data.businessData

                    accountData.accountId = businessInfo.accountId
                    accountData.wabaId = businessInfo.wabaId
                    accountData.wabaToken = businessInfo.wabaToken
                    accountData.businessName = businessInfo.businessProfile?.name
                    accountData.tagline = businessInfo.businessProfile?.tagline
                    accountData.serviceDescription = businessInfo.businessProfile?.serviceDescription
                    accountData.about = businessInfo.businessProfile?.about
                    accountData.disabled = businessInfo.disabled

                    await this.accountDataRepo.save(accountData)
                } 
            }
        } catch (error) {
            this.logger.error("Error while processing business update message", { error, accountId: data.businessData.accountId })
        }
    }

    async processAccountUpdate(data: AccountDataUpdatePayload) {
        const accountsData = await this.accountDataRepo.find({ where: { accountId: data.accountData.id } })

        if (accountsData.length === 0) return

        for (const accountData of accountsData) {

            accountData.subscriptionEndDate = data.accountData.subscriptionEndDate
            accountData.disabled = data.accountData.disabled

            await this.accountDataRepo.save(accountData)
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