import { InteractiveList, InteractiveReplyButtons, MessengerEventPattern, MessengerRMQMessage, WHATSAPP_DOCS_MIMETYPES, WHATSAPP_IMAGES_MIMETYPES } from "@lib/thuso-common"
import { ISMContext } from "../state-machines/interactive.state-machine.provider"
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies"
import { ProductMedia } from "./products-state.service"

export const sendTextMessage = (context: ISMContext, client: ThusoClientProxiesService, message: string): void => {
    const genericTextMessage: MessengerRMQMessage = {
        wabaId: context.wabaId,
        metadata: context.metadata,
        contact: context.contact,
        type: "text",
        conversationType: "service",
        text: message
    }
    
    client.emitWhatsappQueue(
        MessengerEventPattern,
        genericTextMessage
    )
}

export const sendMediaMessage = (context: ISMContext, client: ThusoClientProxiesService, mediaLink: string, media: ProductMedia): void => {
    let mediaMessage: MessengerRMQMessage

    if (WHATSAPP_DOCS_MIMETYPES.includes(media.mimetype)) {
        mediaMessage = {
            wabaId: context.wabaId,
            metadata: context.metadata,
            contact: context.contact,
            type: "document",
            mediaLink,
            mimetype: media.mimetype,
            filename: media.filename,
            caption: context.businessInfo.tagline,
            conversationType: "service"
        }
    } else if (WHATSAPP_IMAGES_MIMETYPES.includes(media.mimetype)) {
        mediaMessage = {
            wabaId: context.wabaId,
            metadata: context.metadata,
            contact: context.contact,
            type: "image",
            mediaLink,
            mimetype: media.mimetype,
            caption: context.businessInfo.tagline,
            conversationType: "service"
        }
    }

    client.emitWhatsappQueue(
        MessengerEventPattern,
        mediaMessage
    )
}

export const sendListMessage = (context: ISMContext, client: ThusoClientProxiesService, interactiveList: InteractiveList): void => {
    const paymentMethodsMessage: MessengerRMQMessage = {
        wabaId: context.wabaId,
        metadata: context.metadata,
        contact: context.contact,
        type: "message-body",
        conversationType: "service",
        messageBody: {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: context.contact.wa_id,
            type: "interactive",
            interactive: interactiveList
        }
    }
    client.emitWhatsappQueue(
        MessengerEventPattern,
        paymentMethodsMessage
    )
}

export const sendInteractiveReplyButtonsMessage = (context: ISMContext, client: ThusoClientProxiesService, interactiveReplyButtons: InteractiveReplyButtons): void => {
    const paymentMethodsMessage: MessengerRMQMessage = {
        wabaId: context.wabaId,
        metadata: context.metadata,
        contact: context.contact,
        type: "message-body",
        conversationType: "service",
        messageBody: {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: context.contact.wa_id,
            type: "interactive",
            interactive: interactiveReplyButtons
        }
    }
    client.emitWhatsappQueue(
        MessengerEventPattern,
        paymentMethodsMessage
    )
}