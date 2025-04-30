"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingState = exports.sentimentLabels = exports.MainMenuItems = exports.CHARACTER_TEXT_SPLITTING_OVERLAP = exports.CHARACTER_TEXT_SPLITTING_CHUNK = exports.VECTOR_DOCS_MIMETYPES = exports.IMAGE_MIMETYPES = exports.WHATSAPP_RESUMABLE_MIMETYPES = exports.WHATSAPP_MIMETYPES = exports.WHATSAPP_IMAGES_MIMETYPES = exports.WHATSAPP_DOCS_MIMETYPES = exports.SubscriptionRmqClient = exports.MgntRmqClient = exports.LlmRmqClient = exports.WhatsappRmqClient = exports.TemplateQualityEventPattern = exports.TemplateUpdateEventPattern = exports.NewCustomerBusinessEventPattern = exports.BusinessProfileUpdateChatAgentPattern = exports.BusinessProfileUpdateMessageProcessorPattern = exports.BusinessProfileUpdateMessengerPattern = exports.BusinessUpdateChatAgentPattern = exports.BusinessUpdateMessageProcessorPattern = exports.BusinessUpdateMessengerPattern = exports.UserUpdateAccountsPattern = exports.AccountUpdateChatAgentPattern = exports.AccountUpdateMessageProcessorPattern = exports.AccountUpdateMessengerPattern = exports.AccountUpdateAccountsPattern = exports.TemplateUpdatePattern = exports.SendEmailEventPattern = exports.CustomerRegistrationChatAgentEventPattern = exports.RegisterCustomerToCRMEventPattern = exports.LLMEventPattern = exports.MessengerEventPattern = exports.ContactlessMessageProcessorEventPattern = exports.MessageProcessorEventPattern = exports.LONG_TEST_TIMEOUT = void 0;
exports.LONG_TEST_TIMEOUT = 60_000_000;
exports.MessageProcessorEventPattern = 'message-processor';
exports.ContactlessMessageProcessorEventPattern = 'contactless-message-processor';
exports.MessengerEventPattern = 'messenger';
exports.LLMEventPattern = 'llm';
exports.RegisterCustomerToCRMEventPattern = 'llm-register-customer';
exports.CustomerRegistrationChatAgentEventPattern = 'customer-registered-chat-agent';
exports.SendEmailEventPattern = 'send-email';
exports.TemplateUpdatePattern = 'template-update';
exports.AccountUpdateAccountsPattern = 'account-update-accounts';
exports.AccountUpdateMessengerPattern = 'account-update-messenger';
exports.AccountUpdateMessageProcessorPattern = 'account-update-message-processor';
exports.AccountUpdateChatAgentPattern = 'account-update-chat-agent';
exports.UserUpdateAccountsPattern = 'user-update-accounts';
exports.BusinessUpdateMessengerPattern = 'business-update-messenger';
exports.BusinessUpdateMessageProcessorPattern = 'business-update-message-processor';
exports.BusinessUpdateChatAgentPattern = 'business-update-chat-agent';
exports.BusinessProfileUpdateMessengerPattern = 'business-profile-updat-messenger';
exports.BusinessProfileUpdateMessageProcessorPattern = 'business-profile-update-message-processor';
exports.BusinessProfileUpdateChatAgentPattern = 'business-profile-update-chat-agent';
exports.NewCustomerBusinessEventPattern = "new-customer-to-business";
exports.TemplateUpdateEventPattern = "template-update-notification";
exports.TemplateQualityEventPattern = "template-quality-notification";
exports.WhatsappRmqClient = 'whatsapp_rmq_client';
exports.LlmRmqClient = 'llm_rmq_client';
exports.MgntRmqClient = 'mgnt_rmq_client';
exports.SubscriptionRmqClient = 'subs_rmq_client';
exports.WHATSAPP_DOCS_MIMETYPES = [
    "text/plain",
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];
exports.WHATSAPP_IMAGES_MIMETYPES = ["image/jpeg", "image/png"];
exports.WHATSAPP_MIMETYPES = exports.WHATSAPP_DOCS_MIMETYPES.concat(exports.WHATSAPP_IMAGES_MIMETYPES);
exports.WHATSAPP_RESUMABLE_MIMETYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "video/mp4"];
exports.IMAGE_MIMETYPES = exports.WHATSAPP_IMAGES_MIMETYPES;
exports.VECTOR_DOCS_MIMETYPES = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/pdf",
    "text/plain"
];
exports.CHARACTER_TEXT_SPLITTING_CHUNK = 7 * 200;
exports.CHARACTER_TEXT_SPLITTING_OVERLAP = 7 * 20;
exports.MainMenuItems = [
    { id: "products", title: "Products", description: "List and view products" },
    { id: "promotions", title: "Promotions", description: "View promotions and discounts" },
    { id: "user-preference", title: "My Preferences", description: "Alerts, Promotions and more" }
];
exports.sentimentLabels = [
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
var OnboardingState;
(function (OnboardingState) {
    OnboardingState["CreateWaba"] = "create-business-profile";
    OnboardingState["CreateBusProf"] = "create-business-profile";
    OnboardingState["OnboardComplete"] = "onboarding-complete";
})(OnboardingState || (exports.OnboardingState = OnboardingState = {}));
//# sourceMappingURL=constants.js.map