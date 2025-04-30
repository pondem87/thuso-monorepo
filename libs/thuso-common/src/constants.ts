export const LONG_TEST_TIMEOUT = 60_000_000

// whatsapp message processing
export const MessageProcessorEventPattern = 'message-processor'
export const ContactlessMessageProcessorEventPattern = 'contactless-message-processor'

// sending whatsapp messages
export const MessengerEventPattern = 'messenger'

// llm
export const LLMEventPattern = 'llm'
export const RegisterCustomerToCRMEventPattern = 'llm-register-customer'
export const CustomerRegistrationChatAgentEventPattern = 'customer-registered-chat-agent'
export const NewTopicLLMEventPattern = 'new-llm-conversation-topic'

// sending emails
export const SendEmailEventPattern = 'send-email'

// submitting templates
export const TemplateUpdatePattern = 'template-update'

// account creation, change and delete handlers
export const AccountUpdateAccountsPattern = 'account-update-accounts'
export const AccountUpdateMessengerPattern = 'account-update-messenger'
export const AccountUpdateMessageProcessorPattern = 'account-update-message-processor'
export const AccountUpdateChatAgentPattern = 'account-update-chat-agent'

// account creation, change and delete handlers
export const UserUpdateAccountsPattern = 'user-update-accounts'

// busines creation, update and delete handlers
export const BusinessUpdateMessengerPattern = 'business-update-messenger'
export const BusinessUpdateMessageProcessorPattern = 'business-update-message-processor'
export const BusinessUpdateChatAgentPattern = 'business-update-chat-agent'

// business profile creation, update and delete handlers
export const BusinessProfileUpdateMessengerPattern = 'business-profile-updat-messenger'
export const BusinessProfileUpdateMessageProcessorPattern = 'business-profile-update-message-processor'
export const BusinessProfileUpdateChatAgentPattern = 'business-profile-update-chat-agent'

// crm
export const NewCustomerBusinessEventPattern = "new-customer-to-business"

// template
export const TemplateUpdateEventPattern = "template-update-notification"
export const TemplateQualityEventPattern = "template-quality-notification"

// rmq client names
export const WhatsappRmqClient = 'whatsapp_rmq_client'
export const LlmRmqClient = 'llm_rmq_client'
export const MgntRmqClient = 'mgnt_rmq_client'
export const SubscriptionRmqClient = 'subs_rmq_client'

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
export const WHATSAPP_RESUMABLE_MIMETYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "video/mp4"]
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

  export enum OnboardingState {
    CreateWaba = "create-whatsapp-business",
    CreateBusProf = "create-business-profile",
    ReadNextSteps = "read-next-steps",
    OnboardComplete = "onboarding-complete"
}