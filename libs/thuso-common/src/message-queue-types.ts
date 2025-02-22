import { Contact, MessageBody, Messages, Metadata } from "./whatsapp-api-types";

export class MessageProcessorRMQMessage {
    wabaId: string
    contact?: Contact
    metadata: Metadata
    message: Messages
}

export class MessengerRMQMessage {
    metadata: Metadata
    contact: Contact
    type: "text" | "image" | "menu" | "message-body"
    text?: string
    mediaLink?: string
    messageBody?: MessageBody
    menuId?: string
    conversationType: "marketing" | "utility" | "authentication" | "service"
}

export class LLMQueueMessage {
    wabaId: string;
    metadata: Metadata;
    contact: Contact;
    prompt: string
}