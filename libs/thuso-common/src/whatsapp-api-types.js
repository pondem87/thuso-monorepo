"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateStatus = exports.CHAR_LIMITS = exports.WhatsAppWebhookPayloadSchema = void 0;
const zod_1 = require("zod");
const Audio = zod_1.z.object({
    id: zod_1.z.string(),
    mime_type: zod_1.z.string(),
});
const Button = zod_1.z.object({
    payload: zod_1.z.string(),
    text: zod_1.z.string(),
});
const ReferredProduct = zod_1.z.object({
    catalog_id: zod_1.z.string(),
    product_retailer_id: zod_1.z.string(),
});
const Context = zod_1.z.object({
    forwarded: zod_1.z.boolean().optional(),
    frequently_forwarded: zod_1.z.boolean().optional(),
    from: zod_1.z.string().optional(),
    id: zod_1.z.string().optional(),
    referred_product: ReferredProduct.optional(),
});
const Document = zod_1.z.object({
    caption: zod_1.z.string().optional(),
    filename: zod_1.z.string(),
    sha256: zod_1.z.string(),
    mime_type: zod_1.z.string(),
    id: zod_1.z.string(),
});
const Identity = zod_1.z.object({
    acknowledged: zod_1.z.boolean(),
    created_timestamp: zod_1.z.string(),
    hash: zod_1.z.string(),
});
const Image = zod_1.z.object({
    caption: zod_1.z.string().optional(),
    sha256: zod_1.z.string(),
    id: zod_1.z.string(),
    mime_type: zod_1.z.string(),
});
const ButtonReply = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
});
const ListReply = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
});
const Interactive = zod_1.z.object({
    type: zod_1.z.enum(["list_reply", "button_reply"]),
    button_reply: ButtonReply.optional(),
    list_reply: ListReply.optional(),
});
const Location = zod_1.z.object({
    address: zod_1.z.string().optional(),
    latitude: zod_1.z.number(),
    longitude: zod_1.z.number(),
    name: zod_1.z.string().optional(),
});
const ProductItem = zod_1.z.object({
    product_retailer_id: zod_1.z.string(),
    quantity: zod_1.z.string(),
    item_price: zod_1.z.string(),
    currency: zod_1.z.string(),
});
const Order = zod_1.z.object({
    catalog_id: zod_1.z.string(),
    text: zod_1.z.string(),
    product_items: zod_1.z.array(ProductItem),
});
const Referral = zod_1.z.object({
    source_url: zod_1.z.string(),
    source_type: zod_1.z.string(),
    source_id: zod_1.z.string(),
    headline: zod_1.z.string(),
    body: zod_1.z.string(),
    media_type: zod_1.z.string(),
    image_url: zod_1.z.string().optional(),
    video_url: zod_1.z.string().optional(),
    thumbnail_url: zod_1.z.string().optional(),
    ctwa_clid: zod_1.z.string(),
});
const Sticker = zod_1.z.object({
    mime_type: zod_1.z.string(),
    sha256: zod_1.z.string(),
    id: zod_1.z.string(),
    animated: zod_1.z.boolean(),
});
const System = zod_1.z.object({
    body: zod_1.z.string(),
    identity: zod_1.z.string().optional(),
    new_wa_id: zod_1.z.string().optional(),
    wa_id: zod_1.z.string().optional(),
    type: zod_1.z.enum(["user_changed_number", "user_identity_changed"]),
    customer: zod_1.z.string().optional(),
});
const Text = zod_1.z.object({
    body: zod_1.z.string(),
});
const Video = zod_1.z.object({
    caption: zod_1.z.string().optional(),
    filename: zod_1.z.string(),
    sha256: zod_1.z.string(),
    id: zod_1.z.string(),
    mime_type: zod_1.z.string(),
});
const ErrorData = zod_1.z.object({
    details: zod_1.z.string(),
});
const Error = zod_1.z.object({
    code: zod_1.z.number().int(),
    title: zod_1.z.string(),
    message: zod_1.z.string(),
    error_data: ErrorData.optional(),
});
const Messages = zod_1.z.object({
    audio: Audio.optional(),
    button: Button.optional(),
    context: Context.optional(),
    document: Document.optional(),
    errors: zod_1.z.array(Error).optional(),
    from: zod_1.z.string().optional(),
    id: zod_1.z.string().optional(),
    identity: Identity.optional(),
    image: Image.optional(),
    interactive: Interactive.optional(),
    location: Location.optional(),
    order: Order.optional(),
    referral: Referral.optional(),
    sticker: Sticker.optional(),
    system: System.optional(),
    text: Text.optional(),
    timestamp: zod_1.z.string().optional(),
    type: zod_1.z.enum([
        "audio", "button", "document", "text", "image", "interactive", "location",
        "order", "sticker", "system", "unknown", "video",
    ]).optional(),
    video: Video.optional(),
});
const Profile = zod_1.z.object({
    name: zod_1.z.string(),
});
const Contact = zod_1.z.object({
    wa_id: zod_1.z.string(),
    profile: Profile,
});
const Origin = zod_1.z.object({
    type: zod_1.z.enum(["authentication", "marketing", "utility", "service", "referral_conversion"]),
    expiration_timestamp: zod_1.z.string().optional(),
});
const Conversation = zod_1.z.object({
    id: zod_1.z.string(),
    origin: Origin,
});
const Pricing = zod_1.z.object({
    billable: zod_1.z.boolean(),
    category: zod_1.z.enum(["authentication", "marketing", "utility", "service", "referral_conversion"]),
    pricing_model: zod_1.z.enum(["CBP"]),
});
const Statuses = zod_1.z.object({
    biz_opaque_callback_data: zod_1.z.string().optional(),
    conversation: Conversation,
    errors: zod_1.z.array(Error).optional(),
    id: zod_1.z.string(),
    pricing: Pricing.optional(),
    recipient_id: zod_1.z.string(),
    status: zod_1.z.enum(["delivered", "read", "sent"]),
    timestamp: zod_1.z.string(),
});
const Metadata = zod_1.z.object({
    display_phone_number: zod_1.z.string(),
    phone_number_id: zod_1.z.string(),
});
const MessagesChangeValue = zod_1.z.object({
    messaging_product: zod_1.z.string(),
    metadata: Metadata,
    contacts: zod_1.z.array(Contact).optional(),
    errors: zod_1.z.array(Error).optional(),
    messages: zod_1.z.array(Messages).optional(),
    statuses: zod_1.z.array(Statuses).optional(),
});
const TemplateUpdateChangeValue = zod_1.z.object({
    event: zod_1.z.enum(["PENDING", "APPROVED", "REJECTED", "FLAGGED", "PAUSED", "PENDING_DELETION"]),
    message_template_id: zod_1.z.string(),
    message_template_name: zod_1.z.string(),
    message_template_language: zod_1.z.string(),
    reason: zod_1.z.string(),
    disable_info: zod_1.z.object({
        disable_date: zod_1.z.string()
    }).optional(),
    other_info: zod_1.z.object({
        title: zod_1.z.string(),
        description: zod_1.z.string()
    }).optional()
});
const TemplateQualityChangeValue = zod_1.z.object({
    previous_quality_score: zod_1.z.string(),
    new_quality_score: zod_1.z.string(),
    message_template_id: zod_1.z.string(),
    message_template_name: zod_1.z.string(),
    message_template_language: zod_1.z.string()
});
const Change = zod_1.z.discriminatedUnion("field", [
    zod_1.z.object({
        field: zod_1.z.literal("messages"),
        value: MessagesChangeValue,
    }),
    zod_1.z.object({
        field: zod_1.z.literal("message_template_status_update"),
        value: TemplateUpdateChangeValue,
    }),
    zod_1.z.object({
        field: zod_1.z.literal("message_template_quality_update"),
        value: TemplateQualityChangeValue
    })
]);
const Entry = zod_1.z.object({
    id: zod_1.z.string(),
    changes: zod_1.z.array(Change),
});
exports.WhatsAppWebhookPayloadSchema = zod_1.z.object({
    object: zod_1.z.string(),
    entry: zod_1.z.array(Entry),
});
exports.CHAR_LIMITS = {
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
};
var TemplateStatus;
(function (TemplateStatus) {
    TemplateStatus["PENDING"] = "PENDING";
    TemplateStatus["APPROVED"] = "APPROVED";
    TemplateStatus["REJECTED"] = "REJECTED";
    TemplateStatus["FLAGGED"] = "FLAGGED";
    TemplateStatus["PAUSED"] = "PAUSED";
    TemplateStatus["PENDING_DELETION"] = "PENDING_DELETION";
})(TemplateStatus || (exports.TemplateStatus = TemplateStatus = {}));
//# sourceMappingURL=whatsapp-api-types.js.map