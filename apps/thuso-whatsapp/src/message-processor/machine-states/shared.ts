import { InteractiveList, MessengerEventPattern, MessengerRMQMessage } from "@lib/thuso-common"
import { ISMContext } from "../state-machines/interactive.state-machine.provider"
import { ClientProxy } from "@nestjs/microservices"

export const sendTextMessage = (context: ISMContext, whatsAppQueueClient: ClientProxy, message: string): void => {
    const genericTextMessage: MessengerRMQMessage = {
        metadata: context.metadata,
        contact: context.contact,
        type: "text",
        conversationType: "service",
        text: message
    }
    whatsAppQueueClient.emit(
        MessengerEventPattern,
        genericTextMessage
    )
}

export const sendListMessage = (context: ISMContext, whatsAppQueueClient: ClientProxy, interactiveList: InteractiveList): void => {
    const paymentMethodsMessage: MessengerRMQMessage = {
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
    whatsAppQueueClient.emit(
        MessengerEventPattern,
        paymentMethodsMessage
    )
}