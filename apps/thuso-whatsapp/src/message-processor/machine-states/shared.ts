import { InteractiveList, InteractiveReplyButtons, MessengerEventPattern, MessengerRMQMessage } from "@lib/thuso-common"
import { ISMContext } from "../state-machines/interactive.state-machine.provider"
import { ClientProxy } from "@nestjs/microservices"
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies"

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