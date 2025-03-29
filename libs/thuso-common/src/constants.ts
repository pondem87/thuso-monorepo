export const LONG_TEST_TIMEOUT = 60_000_000

export const MessageProcessorEventPattern = 'message-processor'
export const ContactlessMessageProcessorEventPattern = 'contactless-message-processor'
export const MessengerEventPattern = 'messenger'
export const LLMEventPattern = 'llm'

export const WhatsappRmqClient = 'whatsapp_rmq_client'
export const LlmRmqClient = 'llm_rmq_client'

export const WHATSAPP_DOCS_MIMETYPES = [
    "text/plain",
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]
export const WHATSAPP_IMAGES_MIMETYPES = ["image/jpeg", "image/png"]
export const WHATSAPP_MIMETYPES = WHATSAPP_DOCS_MIMETYPES.concat(WHATSAPP_IMAGES_MIMETYPES)
export const IMAGE_MIMETYPES = WHATSAPP_IMAGES_MIMETYPES
export const VECTOR_DOCS_MIMETYPES = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/pdf",
    "text/plain"
]

export const CHARACTER_TEXT_SPLITTING_CHUNK = 7 * 200
export const CHARACTER_TEXT_SPLITTING_OVERLAP = 7 * 20

export const MainMenuItems: {id: string; title: string; description: string}[] = [
    { id: "products", title: "Products", description: "List and view products" },
    { id: "promotions", title: "Promotions", description: "View promotions and discounts" },
    { id: "user-preference", title: "My Preferences", description: "Alerts, Promotions and more" }
]

export const sentimentLabels: { label: string; description: string }[] = [
    {
      label: "Purchase Intent",
      description: "Indicates the customer is interested in buying a product or service."
    },
    {
      label: "Information Seeking",
      description: "Customer is looking for more details about a product, service, or policy."
    },
    {
      label: "Problem Resolution",
      description: "The customer is trying to solve an issue they encountered."
    },
    {
      label: "Positive Feedback",
      description: "Customer is expressing satisfaction or appreciation."
    },
    {
      label: "Negative Feedback",
      description: "Customer is expressing dissatisfaction or criticism."
    },
    {
      label: "Cancellation/Refund Request",
      description: "Customer wants to cancel an order or request a refund."
    },
    {
      label: "Suggestions",
      description: "Customer is providing ideas or recommendations for improvement."
    },
    {
      label: "Unresolved Issue",
      description: "An issue that has not been addressed or resolved satisfactorily."
    }
  ];