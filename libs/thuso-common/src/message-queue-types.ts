import { Gender } from "../../../apps/management/src/crm/types";
import { Contact, MessageBody, Messages, Metadata, Statuses, TemplateQualityUpdate, TemplateStatusUpdate } from "./whatsapp-api-types";

export type MessageProcessorRMQMessage = {
    wabaId: string
    contact?: Contact
    metadata: Metadata
    message: Messages
}

export type MessengerRMQMessage = {
    wabaId: string
    metadata: Metadata
    contact: Contact
    type: "text"
    text: string
    conversationType: "marketing" | "utility" | "authentication" | "service"
    campaignId?: string
} | {
    wabaId: string
    metadata: Metadata
    contact: Contact
    type: "image"
    mediaLink: string
    mimetype: string
    caption: string
    conversationType: "marketing" | "utility" | "authentication" | "service"
    campaignId?: string
} | {
    wabaId: string
    metadata: Metadata
    contact: Contact
    type: "document"
    mediaLink: string
    mimetype: string
    caption: string
    filename: string
    conversationType: "marketing" | "utility" | "authentication" | "service"
    campaignId?: string
} | {
    wabaId: string
    metadata: Metadata
    contact: Contact
    type: "message-body"
    messageBody: MessageBody
    conversationType: "marketing" | "utility" | "authentication" | "service"
    campaignId?: string
} | {
    wabaId: string
    metadata: Metadata
    contact: Contact
    type: "menu"
    menuId: string
    conversationType: "marketing" | "utility" | "authentication" | "service"
    campaignId?: string
}

export type LLMQueueMessage = {
    wabaId: string;
    metadata: Metadata;
    contact: Contact;
    prompt: string
}

export type SendEmailQueueMessage = {
    email: string,
    subject: string,
    text: string,
    html: string
}

export type SubmitTemplateQueueMessage = {
    accountId: string,
    templateId: string
}

export type GenerateMetaMediaHandleMessage = {
    wabaId: string,
    mediaId: string,
    s3key: string,
    fileSize: number,
    mimetype: string,
    filename?: string,
    sessionId?: string
}

export type MetaMediaHandleResultMessage = {
    wabaId: string,
    mediaId: string,
    handle?: string,
    sessionId?: string
    filename?: string
}

// ***********************************************
// Account and user update messages
// ***********************************************
export type AccountDataUpdatePayload = {
    accountData: AccountData,
    event: UpdateEvent
}

export type UserDataUpdatePayload = {
    userData: UserData,
    event: UpdateEvent | "VERIFIED" | "NEW-GUEST" | "VERIFIED-GUEST"
}

type AccountData = {
    id: string
    name: string
    root?: UserData
    maxAllowedBusinesses: number
    maxAllowedDailyConversations: number
    disabled: boolean
    subscriptionEndDate: Date
    createdAt: Date
}

type UserData = {
    id: string
    email: string
    rootOf?: AccountData
    accounts?: AccountData[]
    forenames: string
    surname: string
    verified: boolean
    verificationCode: string
    createdAt: Date
}

type UpdateEvent = "NEW" | "UPDATE" | "DELETE"

// ***********************************************
// Business and Business Profile update messages
// ***********************************************

export type WhatsAppBusinessUpdatePayload = {
    businessData: WhatsAppBusinessData,
    event: UpdateEvent
}

export type BusinessProfileUpdatePayload = {
    businessProfileData: BusinessProfileData,
    event: UpdateEvent
}

type WhatsAppBusinessData = {
    id: string
    accountId: string
    wabaId: string
    name: string
    wabaToken: string
    subscribed: boolean
    disabled: boolean
    businessProfile?: BusinessProfileData
    createdAt: Date
}

type BusinessProfileData = {
    id: string
    accountId: string
    botname: string | null
    greeting: string | null
    name: string
    tagline: string
    serviceDescription: string
    about: string
    imageLogoId: string
    imageBannerId: string
    waba?: WhatsAppBusinessData
}

export type RegisterCustomerEventPayload = {
    accountId: string
    forenames: string
    surname: string
    city: string
    country: string
    age?: number
    gender?: Gender
    whatsAppNumber: string
}

export type CustomerRegistrationChatAgentEventPayload = {
    crmId: string
    fullname: string
    whatsAppNumber: string
    wabaId: string
    phone_number_id?: string[]
}

export type TemplateUpdateEventPayload = {
    wabaId: string
    update: TemplateStatusUpdate
}

export type TemplateQualityEventPayload = {
    wabaId: string,
    update: TemplateQualityUpdate
}

export type NewTopicLLMEventPayload = {
    crmId: string
    topicLabel: string
}

// ***********************************************
// Campaign messages
// ***********************************************
export type CampaignMessageStatusUpdatePayload = {
    campaignId: string
    messageId: string | null
    status: "sent" | "delivered" | "read" | "failed"
}

export type CampaignLaunchEventPayload = {
    campaignId: string
}

export type StopPromotionsEventPayload = {
    whatsAppNumber: string
    accountId: string
    wabaId: string
}

export type ResumeWhatsAppPromoEventPayload = {
    whatsAppNumber: string
    accountId: string
    wabaId: string
}

export type ResumeWhatsAppUpdatesEventPayload = {
    whatsAppNumber: string
    accountId: string
    wabaId: string
}

// ***********************************************
// WhatsApp MessageStatus messages
// ***********************************************
export type WhatsAppMessageStatusUpdatePayload = {
    wabaId: string
    metadata: Metadata
    status: Statuses
}