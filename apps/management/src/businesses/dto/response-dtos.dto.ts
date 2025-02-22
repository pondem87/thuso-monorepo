import { BusinessProfile } from "../entities/business-profile.entity"
import { WhatsAppBusiness } from "../entities/whatsapp-business.entity"
import { WhatsAppNumber } from "../entities/whatsapp-number"

export class WhatsAppBusinessDto {
    id: string
    accountId: string
    wabaId: string
    name?: string
    subscribed: boolean
    businessProfile?: BusinessProfileDto
    appNumbers?: WhatsAppNumberDto[]
    createdAt: Date

    constructor(instance: WhatsAppBusiness) {
        this.id = instance.id
        this.accountId = instance.accountId
        this.wabaId = instance.wabaId
        this.subscribed = instance.subscribed
        this.createdAt = instance.createdAt

        if (instance.name) this.name = instance.name

        if (instance.businessProfile) {
            this.businessProfile = new BusinessProfileDto(instance.businessProfile)
        }

        if (instance.appNumbers && instance.appNumbers.length) {
            this.appNumbers = instance.appNumbers.map((entity) => new WhatsAppNumberDto(entity))
        }
    }
}

export class WhatsAppNumberDto {
    id: string
    accountId: string
    appNumber: string
    appNumberId: string
    pin: string
    registered: boolean
    waba?: WhatsAppBusinessDto

    constructor(instance: WhatsAppNumber) {
        this.id = instance.id
        this.accountId = instance.accountId
        this.appNumber = instance.appNumber ? instance.appNumber : null
        this.appNumberId = instance.appNumberId
        this.pin = instance.pin
        this.registered = instance.registered

        if (instance.waba) {
            this.waba = instance.waba
        }
    }
}

export class BusinessProfileDto {
    id: string
    accountId: string
    name: string
    tagline: string
    serviceDescription: string
    about: string
    imageLogoId?: string
    imageBannerId?: string
    waba?: WhatsAppBusinessDto

    constructor(instance: BusinessProfile) {
        this.id = instance.id
        this.accountId = instance.accountId
        this.name = instance.name
        this.tagline = instance.tagline
        this.serviceDescription = instance.serviceDescription
        this.about = instance.about
        this.imageLogoId = instance.imageLogoId ? instance.imageLogoId : null
        this.imageBannerId = instance.imageBannerId ? instance.imageBannerId : null
        
        if (instance.waba) {
            this.waba = instance.waba
        }
    }
}