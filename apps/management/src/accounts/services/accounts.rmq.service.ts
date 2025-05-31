import { LoggingService } from "@lib/logging"
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies"
import { AccountDataUpdatePayload, emailHtmlTemplate, SendEmailEventPattern, SendEmailQueueMessage, UserDataUpdatePayload } from "@lib/thuso-common"
import { Injectable } from "@nestjs/common"
import { Logger } from "winston"

/*
 * This service handles account and user updates via RabbitMQ messages.
 * It processes account updates and sends welcome and next steps emails to users.
 *
*/

@Injectable()
export class AccountsRmqService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly clientsService: ThusoClientProxiesService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "accounts",
            file: "accounts.api.service"
        })

        this.logger.info("Accounts API Service initialized")
    }

    async processAccountUpdate(data: AccountDataUpdatePayload) {
        switch (data.event) {
            case "NEW":

                break;
            case "UPDATE":

                break;
            default:
                break;
        }
    }

    /**
     * Processes user data updates and sends appropriate emails based on the event type.
     * @param data - type: UserDataUpdatePayload - The user data update payload containing event type and user data.
     */
    async processUserUpdate(data: UserDataUpdatePayload) {
        switch (data.event) {
            case "NEW":
            case "NEW-GUEST":
                const emailHtml = this.generateUserWelcomeEmailHtml(data.userData.verificationCode)
                const emailText = this.generateWelcomeEmailText(data.userData.verificationCode)

                this.clientsService.emitMgntQueue(
                    SendEmailEventPattern,
                    {
                        subject: "Thuso: Account Verification",
                        email: data.userData.email,
                        text: emailText,
                        html: emailHtml
                    } as SendEmailQueueMessage
                )
                break;
            case "VERIFIED":
                const emailHtml1 = this.generateNextStepsEmailHtml(`${data.userData.forenames} ${data.userData.surname}`.replace(/\b\w/g, (char) => char.toUpperCase()))
                const emailText1 = this.genarateNextStepsEmailText(`${data.userData.forenames} ${data.userData.surname}`.replace(/\b\w/g, (char) => char.toUpperCase()))

                this.clientsService.emitMgntQueue(
                    SendEmailEventPattern,
                    {
                        subject: "Thuso: NextSteps",
                        email: data.userData.email,
                        text: emailText1,
                        html: emailHtml1
                    } as SendEmailQueueMessage
                )
                break;
            default:
                break;
        }
    }

    generateUserWelcomeEmailHtml(verificationCode: string) {
        return emailHtmlTemplate(
            `Welcome to Thuso`,
            `
                <h3 style="text-align: center;">Use this code to verify your account: <strong>${verificationCode}</strong></h3>
                <h2 style="color: #2c3e50;">👋 Welcome to <strong>Thuso</strong>!</h2>
                <p>Your 24/7 Smart Support Solution.</p>

                <h3 style="color: #2c3e50;">What Thuso Offers:</h3>
                <ul style="line-height: 1.6; padding-left: 20px; color: #34495e;">
                    <li><strong>✅ Always-On Support:</strong> A tireless assistant available around the clock to answer questions, share product info, and collect feedback instantly.</li>
                    <li><strong>✅ Affordable & Scalable:</strong> Handle high volumes of customers without increasing overhead—perfect for growing businesses.</li>
                    <li><strong>✅ Insights Without the Clunky Forms:</strong> Understand what your customers need through natural, human-like chats—no long surveys required.</li>
                    <li><strong>✅ Boost Customer Loyalty:</strong> Fast, accurate, and friendly responses that build trust and keep customers coming back.</li>
                    <li><strong>✅ Smarter Business Decisions:</strong> Turn every chat into valuable insights to improve your products, services, and strategy.</li>
                    <li><strong>✅ Free Up Your Team:</strong> Let Thuso handle the FAQs so your staff can focus on high-impact tasks and customer care.</li>
                    <li><strong>✅ WhatsApp Business Platform Integration:</strong> Send bulk messages with images, videos, and documents to engage customers more effectively using rich multimedia communication.</li>
                </ul>
            `
        )
    }

    generateWelcomeEmailText(verificationCode: string) {
        return `Welcome to Thuso.\n\nUse this code to verify your account: ${verificationCode}`
    }

    generateNextStepsEmailHtml(name: string) {
        return emailHtmlTemplate(
            `Next Steps`,
            `
            <h2>Dear ${name},</h2>
            <p>Congratulations! Your Thuso account has been successfully verified. You are now just a few steps away from setting up your WhatsApp chatbot.</p>

            <h3>What’s Next?</h3>
            <ol>
                <li><strong>Create Your WhatsApp Business Account</strong><br>
                    - Click <a href="https://manage.thuso.pfitztronic.co.bw/dashboard">here</a> to log in to Thuso and start your setup.<br>
                    - You will need a Facebook account and a phone number that is not currently in use on WhatsApp.
                </li>
                <li><strong>Link Your WhatsApp Number</strong><br>
                    - Follow the guided steps to connect your WhatsApp number.<br>
                    - This number will be used by your chatbot to interact with customers.
                </li>
                <li><strong>Set Up Your Business Profile</strong><br>
                    - Fill in key business details to help Thuso provide accurate responses.<br>
                    - Upload FAQs, business documents, and customer service guides.
                </li>
                <li><strong>Upload Your Product Catalogue</strong><br>
                    - Showcase your products by adding descriptions, images, and PDFs.<br>
                    - Your customers will be able to browse and interact with your listings.
                </li>
            </ol>

            <h3>Need Help?</h3>
            <p>If you have any questions or need support, checkout our youtube videos on this <a href="https://youtube.com/playlist?list=PLkoJj1kzJr3C_BC5mYaFYLhN_h_DotmdD&si=wJHD6L3zbBjgpsav">playlist</a> or visit our <a href="https://thuso.pfitztronic.co.bw">website</a> or reply to this email.</p>

            <p>We’re excited to have you on board!</p>
            <p><strong>Best regards,</strong><br>The Thuso Team</p>
            `
        )
    }

    genarateNextStepsEmailText(name: string) {
        return `
        Dear ${name},\n\n
        Congratulations! Your Thuso account has been successfully verified. You are now just a few steps away from setting up your WhatsApp chatbot.\n\n
        What’s Next?\n
        1. Create Your WhatsApp Business Account\n
        - Click here to log in to Thuso and start your setup.\n
        - You will need a Facebook account and a phone number that is not currently in use on WhatsApp.\n
        2. Link Your WhatsApp Number\n
        - Follow the guided steps to connect your WhatsApp number.\n
        - This number will be used by your chatbot to interact with customers.\n
        3. Set Up Your Business Profile\n- Fill in key business details to help Thuso provide accurate responses.\n
        - Upload FAQs, business documents, and customer service guides.\n
        4. Upload Your Product Catalogue\n
        - Showcase your products by adding descriptions, images, and PDFs.\n
        - Your customers will be able to browse and interact with your listings.\n\n
        Need Help?\n
        If you have any questions or need support, visit our website or reply to this email.\n\n
        We’re excited to have you on board!\n
        Best regards,\n
        The Thuso Team`
    }
}