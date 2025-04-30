import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { LoggingService } from '@lib/logging';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { DeleteResult, EntityNotFoundError, Repository } from 'typeorm';
import { APIError, BusinessProfileUpdateChatAgentPattern, BusinessProfileUpdateMessageProcessorPattern, BusinessProfileUpdateMessengerPattern, BusinessProfileUpdatePayload, BusinessUpdateChatAgentPattern, BusinessUpdateMessageProcessorPattern, BusinessUpdateMessengerPattern, emailHtmlTemplate, generateRandomString, MgntRmqClient, SendEmailEventPattern, SendEmailQueueMessage, WhatsAppBusinessUpdatePayload } from '@lib/thuso-common';
import { WhatsAppBusiness } from '../entities/whatsapp-business.entity';
import { WhatsAppNumber } from '../entities/whatsapp-number.entity';
import { Account } from '../../accounts/entities/account.entity';
import { CreateBusinessProfileDto } from '../dto/create-business-profile.dto';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { WhatsAppBusinessDto, WhatsAppNumberDto, BusinessProfileDto } from '../dto/response-dtos.dto';
import { UpdateBusinessProfileDto } from '../dto/update-business-profile.dto';
import { BusinessProfile } from '../entities/business-profile.entity';
import { User } from '../../accounts/entities/user.entity';
import { ThusoClientProxiesService } from '@lib/thuso-client-proxies';

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
        private readonly configService: ConfigService,
        private readonly clientsService: ThusoClientProxiesService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "businesses",
            file: "businesses.service"
        })

        this.logger.info("Businesses service created")
    }

    async createWhatsAppBusiness(user: User, accountId: string, data: CreateBusinessDto): Promise<{ waba: WhatsAppBusinessDto, appNumber: WhatsAppNumberDto } | { error: string }> {
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

            const businessTokenData = await businessTokenResponse.json()
            const businessToken = businessTokenData.access_token

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
                const res = await registerResponse.json()
                this.logger.warn("Failed to register WhatsApp Number", { waba_id: business.wabaId, phone_number_id: appNumber.appNumberId, response: res, status_code: registerResponse.status })
                if (res.error) {
                    const apiError: APIError = res.error
                    if (apiError.type === "OAuthException" && apiError.code === 133005) {
                        // This means the pin is incorrect
                        // Send email to user notify that a pin change is required
                        this.logger.warn("Pin change required", { accountId, phone_number_id: appNumber.appNumberId })
                        this.clientsService.emitMgntQueue(SendEmailEventPattern, {
                            email: user.email,
                            subject: "Thuso: WhatsApp Number Pin Change Required",
                            html: this.generatePinChangeEmail("WhatsApp Number Pin Change Required"),
                            text: this.genetePinChangeEmailText("WhatsApp Number Pin Change Required")
                        } as SendEmailQueueMessage)
                    }
                }
            }

            // inform services of business creation
            const businessDataPayload = {
                businessData: {
                    ...business
                },
                event: "NEW"
            } as WhatsAppBusinessUpdatePayload

            this.clientsService.emitWhatsappQueue(BusinessUpdateMessageProcessorPattern, businessDataPayload)
            this.clientsService.emitWhatsappQueue(BusinessUpdateMessengerPattern, businessDataPayload)
            this.clientsService.emitLlmQueue(BusinessUpdateChatAgentPattern, businessDataPayload)

            return {
                waba: new WhatsAppBusinessDto(business),
                appNumber: new WhatsAppNumberDto(appNumber)
            }

        } catch (error) {
            this.logger.error("Error while creating WhatsApp Business", { accountId, error })
            throw new HttpException("Error while creating WhatsApp Business", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getDisplayNumber(accountId: string, id: string): Promise<{ success: boolean }> {
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
            await this.whatsappNumberRepository.save(appNumber)
            return { success: true }
        } catch (error) {
            this.logger.error("Error while getting display number", { accountId, error: JSON.stringify(error) })
            throw new HttpException("Error while getting display number", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getBusinessName(accountId: string, id: string): Promise<WhatsAppBusinessDto> {
        try {
            const business = await this.whatsappBusinessRepository.findOne({ where: { accountId, id }, relations: { appNumbers: true } })

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
                return { success: false }
            }

            const result = await registerResponse.json()
            appNumber.registered = result.success
            await this.whatsappNumberRepository.save(appNumber)

            return { success: true }
        } catch (error) {
            this.logger.error("Failed to register number", { accountId, numberId: id, error: JSON.stringify(error) })
            throw new HttpException("Failed to register number", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async subscribeBusiness(accountId: string, id: string) {
        try {
            const business = await this.whatsappBusinessRepository.findOne({ where: { accountId, id }, relations: { appNumbers: true } })
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

            return new WhatsAppBusinessDto(await this.whatsappBusinessRepository.save(business))
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
            // deregister phone number
            const appNumber = await this.whatsappNumberRepository.findOne({ where: { accountId, id }, relations: { waba: true } })

            const deregisterResponse = await fetch(
                `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/${appNumber.appNumberId}/deregister`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${appNumber.waba.wabaToken}`,
                        "Content-Type": "application/json"
                    }
                }
            )

            if (!deregisterResponse.ok) {
                const errorResponse = await deregisterResponse.json()
                this.logger.warn("Failed to deregister number", { accountId, numberId: id, response: errorResponse })
                if (errorResponse.error) {
                    const apiError: APIError = errorResponse.error
                    if (apiError.type === "OAuthException" && apiError.code === 100) {
                        // This means the number is already deregistered
                        this.logger.info("Number already deregistered", { accountId, numberId: id })
                    } else {
                        throw new HttpException(`Failed to deregister number: ${apiError.message}`, HttpStatus.INTERNAL_SERVER_ERROR)
                    }
                }
            }

            return await this.whatsappNumberRepository.delete({ accountId, id })
        } catch (error) {
            this.logger.error("Failed to delete whatsapp number", { accountId, numberId: id, error })
            throw new HttpException("Error while deleting phone number", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async deleteBusiness(accountId: string, id: string): Promise<DeleteResult> {
        try {
            const waba = await this.whatsappBusinessRepository.findOne({ where: { accountId, id }, relations: { appNumbers: true } })

            if (waba) {
                if (waba.appNumbers && waba.appNumbers.length > 0) {
                    for (const number of waba.appNumbers) {
                        await this.deleteAppNumber(accountId, number.id)
                    }
                }
            }

            // unsubscribe from the business webhooks
            const unsubscribeResponse = await fetch(
                `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/${waba.wabaId}/subscribed_apps`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${waba.wabaToken}`
                    }
                }
            )

            if (!unsubscribeResponse.ok) {
                this.logger.error("Failed to unsubscribe WABA", { accountId, businessId: id, response: await unsubscribeResponse.json() })
                throw new Error(`Failed to unsubscribe WABA: ${JSON.stringify(await unsubscribeResponse.json())}`)
            }

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

            // inform services of this business profile creation
            const businessProfileDataPayload: BusinessProfileUpdatePayload = {
                businessProfileData: {
                    ...businessProfile,
                    waba: business
                },
                event: "NEW"
            }

            this.clientsService.emitWhatsappQueue(BusinessProfileUpdateMessageProcessorPattern, businessProfileDataPayload)
            this.clientsService.emitWhatsappQueue(BusinessProfileUpdateMessengerPattern, businessProfileDataPayload)
            this.clientsService.emitLlmQueue(BusinessProfileUpdateChatAgentPattern, businessProfileDataPayload)

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
                const business = await this.whatsappBusinessRepository.findOneBy({ id: data.businessId })
                if (business) businessProfile.waba = business
                delete data.businessId
            }

            const keys = Object.keys(data)
            for (const key of keys) {
                businessProfile[key] = data[key]
            }

            const newBusinessProfile = await this.businessProfileRepository.save(businessProfile);

            // inform services of this business profile update
            const businessProfileDataPayload: BusinessProfileUpdatePayload = {
                businessProfileData: {
                    ...newBusinessProfile
                },
                event: "UPDATE"
            }

            this.clientsService.emitWhatsappQueue(BusinessProfileUpdateMessageProcessorPattern, businessProfileDataPayload)
            this.clientsService.emitWhatsappQueue(BusinessProfileUpdateMessengerPattern, businessProfileDataPayload)
            this.clientsService.emitLlmQueue(BusinessProfileUpdateChatAgentPattern, businessProfileDataPayload)

            return new BusinessProfileDto(businessProfile);
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
            const newBusiness = await this.whatsappBusinessRepository.save(business)

            // inform services of business update
            const businessDataPayload = {
                businessData: {
                    ...newBusiness
                },
                event: "UPDATE"
            } as WhatsAppBusinessUpdatePayload

            this.clientsService.emitWhatsappQueue(BusinessUpdateMessageProcessorPattern, businessDataPayload)
            this.clientsService.emitWhatsappQueue(BusinessUpdateMessengerPattern, businessDataPayload)
            this.clientsService.emitLlmQueue(BusinessUpdateChatAgentPattern, businessDataPayload)

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




    // Emails
    generatePinChangeEmail(heading: string) {
        return emailHtmlTemplate(
            heading,
            `
            <p>Dear User,</p>
            <p>We noticed that you attempted to register your number with Thuso, but the process was unsuccessful due to a two-factor authentication PIN issue.
                This may be caused by WhatsApp Cloud API requiring the previously set PIN, even after the number is deleted from Thuso.</p>
            <p>To resolve this, you have two options:</p>
            <ol>
                <li>Manually delete the number from your WhatsApp Business Account through the Facebook Business Manager console.</li>
                <li>Update your PIN in WhatsApp Manager to match the one generated in Thuso.</li>
            </ol>
            <p><strong>How to Update Your PIN in WhatsApp Manager:</strong></p>
            <ol>
                <li>Go to <a href="https://business.facebook.com/">Facebook Business</a> and log into your account.</li>
                <li>Select the business managing your WhatsApp Business Account (WABA).</li>
                <li>Click on <strong>WhatsApp Accounts</strong> and find the WABA linked to your number.</li>
                <li>Click on the WABA to open the info panel.</li>
                <li>Under <strong>Settings</strong>, click <strong>WhatsApp Manager</strong>.</li>
                <li>Locate your phone number and go to <strong>Settings</strong>.</li>
                <li>Click on <strong>Two-step verification</strong>.</li>
                <li>Select <strong>Change PIN</strong> and enter a new PIN.</li>
                <li>Confirm the new PIN to complete the update.</li>
            </ol>
            <p>Once you have updated your PIN, please try registering your number with Thuso again.</p>
            <p>If you need further assistance, feel free to contact our support team.</p>
            <p>Best regards,</p>
            <p>Thuso Customer Relations Team</p>
            `
        )
    }

    genetePinChangeEmailText(heading: string) {
        return `
            ${heading}
            Dear User,\n\n
            We noticed that you attempted to register your number with Thuso, but the process was unsuccessful due to a two-factor authentication PIN issue. This may be caused by WhatsApp Cloud API requiring the previously set PIN, even after the number is deleted from Thuso.\n\n
            To resolve this, you have two options:\n
            1. Manually delete the number from your WhatsApp Business Account through the Facebook Business Manager console.\n
            2. Update your PIN in WhatsApp Manager to match the one generated in Thuso.\n\n
            How to Update Your PIN in WhatsApp Manager:\n
            1. Go to https://business.facebook.com/ and log into your account.\n
            2. Select the business managing your WhatsApp Business Account (WABA).\n
            3. Click on "WhatsApp Accounts" and find the WABA linked to your number.\n
            4. Click on the WABA to open the info panel.\n
            5. Under "Settings", click "WhatsApp Manager".\n
            6. Locate your phone number and go to "Settings".\n
            7. Click on "Two-step verification".\n
            8. Select "Change PIN" and enter a new PIN.\n
            9. Confirm the new PIN to complete the update.\n\n
            Once you have updated your PIN, please try registering your number with Thuso again.\n\n
            If you need further assistance, feel free to contact our support team.\n\n
            Best regards,\n\n
            Thuso Support Team
            `
    }
}
