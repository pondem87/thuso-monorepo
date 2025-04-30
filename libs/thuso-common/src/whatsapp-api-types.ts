import { z } from "zod"

/*
 *  DTOS FOR PARSING WHATSAPP WEBHOOK PAYLOAD
 *  
 */

// MESSAGES DTO ////////////////////////////////////////////////////////////////////////////////

const Audio = z.object({
    id: z.string(),
    mime_type: z.string(),
});

const Button = z.object({
    payload: z.string(),
    text: z.string(),
});

const ReferredProduct = z.object({
    catalog_id: z.string(),
    product_retailer_id: z.string(),
});

const Context = z.object({
    forwarded: z.boolean().optional(),
    frequently_forwarded: z.boolean().optional(),
    from: z.string().optional(),
    id: z.string().optional(),
    referred_product: ReferredProduct.optional(),
});

const Document = z.object({
    caption: z.string().optional(),
    filename: z.string(),
    sha256: z.string(),
    mime_type: z.string(),
    id: z.string(),
});

const Identity = z.object({
    acknowledged: z.boolean(),
    created_timestamp: z.string(),
    hash: z.string(),
});

const Image = z.object({
    caption: z.string().optional(),
    sha256: z.string(),
    id: z.string(),
    mime_type: z.string(),
});

const ButtonReply = z.object({
    id: z.string(),
    title: z.string(),
});

const ListReply = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
});

const Interactive = z.object({
    type: z.enum(["list_reply", "button_reply"]),
    button_reply: ButtonReply.optional(),
    list_reply: ListReply.optional(),
});

const Location = z.object({
    address: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    name: z.string().optional(),
});

const ProductItem = z.object({
    product_retailer_id: z.string(),
    quantity: z.string(),
    item_price: z.string(),
    currency: z.string(),
});

const Order = z.object({
    catalog_id: z.string(),
    text: z.string(),
    product_items: z.array(ProductItem),
});

const Referral = z.object({
    source_url: z.string(),
    source_type: z.string(),
    source_id: z.string(),
    headline: z.string(),
    body: z.string(),
    media_type: z.string(),
    image_url: z.string().optional(),
    video_url: z.string().optional(),
    thumbnail_url: z.string().optional(),
    ctwa_clid: z.string(),
});

const Sticker = z.object({
    mime_type: z.string(),
    sha256: z.string(),
    id: z.string(),
    animated: z.boolean(),
});

const System = z.object({
    body: z.string(),
    identity: z.string().optional(),
    new_wa_id: z.string().optional(),
    wa_id: z.string().optional(),
    type: z.enum(["user_changed_number", "user_identity_changed"]),
    customer: z.string().optional(),
});

const Text = z.object({
    body: z.string(),
});

const Video = z.object({
    caption: z.string().optional(),
    filename: z.string(),
    sha256: z.string(),
    id: z.string(),
    mime_type: z.string(),
});

const ErrorData = z.object({
    details: z.string(),
});

const Error = z.object({
    code: z.number().int(),
    title: z.string(),
    message: z.string(),
    error_data: ErrorData.optional(),
});

const Messages = z.object({
    audio: Audio.optional(),
    button: Button.optional(),
    context: Context.optional(),
    document: Document.optional(),
    errors: z.array(Error).optional(),
    from: z.string().optional(),
    id: z.string().optional(),
    identity: Identity.optional(),
    image: Image.optional(),
    interactive: Interactive.optional(),
    location: Location.optional(),
    order: Order.optional(),
    referral: Referral.optional(),
    sticker: Sticker.optional(),
    system: System.optional(),
    text: Text.optional(),
    timestamp: z.string().optional(),
    type: z.enum([
        "audio", "button", "document", "text", "image", "interactive", "location",
        "order", "sticker", "system", "unknown", "video",
    ]).optional(),
    video: Video.optional(),
});

export type Messages = z.infer<typeof Messages>

const Profile = z.object({
    name: z.string(),
});

const Contact = z.object({
    wa_id: z.string(),
    profile: Profile,
});

export type Contact = z.infer<typeof Contact>

const Origin = z.object({
    type: z.enum(["authentication", "marketing", "utility", "service", "referral_conversion"]),
    expiration_timestamp: z.string().optional(),
});

const Conversation = z.object({
    id: z.string(),
    origin: Origin,
});

const Pricing = z.object({
    billable: z.boolean(),
    category: z.enum(["authentication", "marketing", "utility", "service", "referral_conversion"]),
    pricing_model: z.enum(["CBP"]),
});

const Statuses = z.object({
    biz_opaque_callback_data: z.string().optional(),
    conversation: Conversation,
    errors: z.array(Error).optional(),
    id: z.string(),
    pricing: Pricing.optional(),
    recipient_id: z.string(),
    status: z.enum(["delivered", "read", "sent"]),
    timestamp: z.string(),
});

const Metadata = z.object({
    display_phone_number: z.string(),
    phone_number_id: z.string(),
});

export type Metadata = z.infer<typeof Metadata>

const MessagesChangeValue = z.object({
    messaging_product: z.string(),
    metadata: Metadata,
    contacts: z.array(Contact).optional(),
    errors: z.array(Error).optional(),
    messages: z.array(Messages).optional(),
    statuses: z.array(Statuses).optional(),
});

const TemplateUpdateChangeValue = z.object({
    event: z.enum(["PENDING", "APPROVED", "REJECTED", "FLAGGED", "PAUSED", "PENDING_DELETION"]),
    message_template_id: z.string(),
    message_template_name: z.string(),
    message_template_language: z.string(),
    reason: z.string(),
    disable_info: z.object({
        disable_date: z.string()
    }).optional(),
    other_info: z.object({
        title: z.string(),
        description: z.string()
    }).optional()

});

export type TemplateStatusUpdate = z.infer<typeof TemplateUpdateChangeValue>

const TemplateQualityChangeValue = z.object({
    previous_quality_score: z.string(),
    new_quality_score: z.string(),
    message_template_id: z.string(),
    message_template_name: z.string(),
    message_template_language: z.string()
});

export type TemplateQualityUpdate = z.infer<typeof TemplateQualityChangeValue>

// Create the discriminated union based on `field`
const Change = z.discriminatedUnion("field", [
    z.object({
        field: z.literal("messages"),
        value: MessagesChangeValue,
    }),
    z.object({
        field: z.literal("message_template_status_update"),
        value: TemplateUpdateChangeValue,
    }),
    z.object({
        field: z.literal("message_template_quality_update"),
        value: TemplateQualityChangeValue
    })
]);

const Entry = z.object({
    id: z.string(),
    changes: z.array(Change),
});

export const WhatsAppWebhookPayloadSchema = z.object({
    object: z.string(),
    entry: z.array(Entry),
});

export type WhatsAppWebhookPayload = z.infer<typeof WhatsAppWebhookPayloadSchema>

/*
 *
 * Meta messages API request body shapes
 * 
 * OBJECTS FOR BUILDING API CALL PAYLOADS FOR WHATSAPP CLOUD API
 *
 */


type RecipientType = "individual"
type MessagingProduct = "whatsapp"

// Text message
export interface TextMessageBody {
    messaging_product: MessagingProduct
    recipient_type: RecipientType
    to: string
    type: "text"
    text: {
        preview_url: boolean
        body: string
    }
}

// Interactive list message
interface Row {
    id: string
    title: string
    description: string
}

interface Section {
    title: string
    rows: Row[]
}

export interface InteractiveList {
    type: "list",
    header: {
        type: "text",
        text: string
    },
    body: {
        text: string
    },
    footer: {
        text: string
    },
    action: {
        sections: Section[]
        button: string
    }
}

export interface InteractiveListMessageBody {
    messaging_product: MessagingProduct
    recipient_type: RecipientType
    to: string
    type: "interactive"
    interactive: InteractiveList
}


// Interactive reply button message
interface ReplyButton {
    type: "reply"
    reply: {
        id: string
        title: string
    }
}

type Header = {
    type: "image",
    image: {
        id: string
    } | {
        link: string
    }
} | {
    type: "document",
    document: {
        id: string
    } | {
        link: string
    }
} | {
    type: "text",
    text: string
}

export interface InteractiveReplyButtons {
    type: "button"
    header: Header
    body: {
        text: string
    }
    footer: {
        text: string
    },
    action: {
        buttons: ReplyButton[]
    }
}

export interface InteractiveReplyButtonsMessageBody {
    messaging_product: MessagingProduct
    recipient_type: RecipientType
    to: string
    type: "interactive",
    interactive: InteractiveReplyButtons
}

// template message
type TextParameter = {
    type: "text",
    text: string
}

type NamedTextParameter = {
    type: "text",
    parameter_name: string,
    text: string
}

type HeaderParameter = {
    type: "image",
    image: {
        id: string
    }
} | {
    type: "document",
    document: {
        id: string
    }
} | {
    type: "video",
    video: {
        id: string
    }
} | NamedTextParameter | TextParameter

export type Component = {
    type: "header",
    parameters?: HeaderParameter[]
} | {
    type: "body",
    parameters?: TextParameter[] | NamedTextParameter[]
} | {
    type: "button",
    sub_type: "url" | "quick_reply" | "phone_number",
    index: string,
    parameters?: TextParameter[]
}

export interface TemplateMessageBody {
    messaging_product: MessagingProduct
    recipient_type: RecipientType
    to: string
    type: "template",
    template: {
        name: string,
        language: {
            code: "en_US"
        },
        "components": Component[]
    }
}

export interface ImageMessageBody {
    messaging_product: MessagingProduct
    recipient_type: RecipientType
    to: string
    type: "image",
    image: {
        id: string
        caption: string
    } | {
        link: string
        caption: string
    }
}

// messageBody
export type MessageBody = TemplateMessageBody | InteractiveReplyButtonsMessageBody | InteractiveListMessageBody
    | TextMessageBody | ImageMessageBody


// endpoint response
export type MessagesResponse = {
    messaging_product: MessagingProduct,
    contacts: [
        {
            input: string,
            wa_id: string
        }
    ],
    messages: [
        {
            id: string,
            message_status: "accepted" | "held_for_quality_assessment",
        }
    ]
}


// character limits
export const CHAR_LIMITS = {
    BUTTON_TEXT: 20,
    MESSAGE_BODY: 4096,
    MESSAGE_FOOTER_TEXT: 60,
    MESSAGE_HEADER_TEXT: 60,
    ROW_DESCRIPTION_TEXT: 72,
    ROW_ID: 200,
    ROW_TITLE_TEXT: 24,
    SECTION_TITLE_TEXT: 24,
    BUTTON_LABEL_TEXT: 20,
    BODY_TEXT: 1024
}


// API ERRORS
export type APIError = {
    message: string,
    type: string,
    code: number,
    error_subcode?: number,
    error_user_title?: string,
    error_user_msg?: string,
    fbtrace_id: string
}


/*
 *
 * Meta messages API message template shapes
 * 
 * OBJECTS FOR BUILDING TEMPLATES FOR WHATSAPP CLOUD API
 *
 */


export type TemplateButton = {
    type: "PHONE_NUMBER",
    text: string,
    phone_number: string
} | {
    type: "URL",
    text: string,
    url: string,
    example?: string[]
} | {
    type: "QUICK_REPLY",
    text: string
}

export type TemplateHeader = {
    type: "HEADER",
    format: "TEXT",
    text: string,
    example?: {
        header_text: string[]
    }
} | {
    type: "HEADER",
    format: "IMAGE" | "VIDEO" | "DOCUMENT",
    example?: {
        header_handle: [string,]
    }
} | {
    type: "HEADER",
    format: "LOCATION",
    example?: {
        header_handle: [string,]
    }
}

export type TemplateBody = {
    type: "BODY",
    text: string,
    example?: {
        body_text: [string[],]   // not sure if variable name is a mistake in Meta's documentation
    }
}

export type TemplateFooter = {
    type: "FOOTER",
    text: string
}

export type TemplateButtons = {
    type: "BUTTONS",
    buttons: TemplateButton[]
}

export type TemplateComponent = TemplateHeader | TemplateBody | TemplateFooter | TemplateButtons

export type WhatsAppTemplateType = {
    name: string,
    language: "en_US",
    category: "UTILITY" | "MARKETING" | "AUTHENTICATION",
    components: TemplateComponent[],
    parameter_format: "POSITIONAL"
}

export enum TemplateStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    FLAGGED = "FLAGGED",
    PAUSED = "PAUSED",
    PENDING_DELETION = "PENDING_DELETION"

}