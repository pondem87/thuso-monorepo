import { Contact, MessageBody, Messages, Metadata } from "./whatsapp-api-types";

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
    type: "text",
    text: string
    conversationType: "marketing" | "utility" | "authentication" | "service"
} | {
    wabaId: string
    metadata: Metadata
    contact: Contact
    type: "image" | "document" | "audio" | "video"
    mediaLink: string
    mimetype: string
    caption: string
    conversationType: "marketing" | "utility" | "authentication" | "service"
} | {
    wabaId: string
    metadata: Metadata
    contact: Contact
    type: "message-body"
    messageBody: MessageBody
    conversationType: "marketing" | "utility" | "authentication" | "service"
} | {
    wabaId: string
    metadata: Metadata
    contact: Contact
    type: "menu"
    menuId: string
    conversationType: "marketing" | "utility" | "authentication" | "service"
}

export type LLMQueueMessage = {
    wabaId: string;
    metadata: Metadata;
    contact: Contact;
    prompt: string
}