import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { LoggingService } from "@lib/logging";
import { MainMenuItems } from "@lib/thuso-common";
import { ISMContext, ISMEventType } from "../state-machines/interactive.state-machine.provider";
import { LLMQueueService } from "../services/llm-queue.service";
import { sendTextMessage } from "./shared";
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies";

@Injectable()
export class HomeStateService {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly llmQueueService: LLMQueueService,
        private readonly clientsService: ThusoClientProxiesService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "home-state.service"
        })

        this.logger.info("Initializing HomeStateService")
    }

    executeHomeState = async ({ context }: { context: ISMContext}): Promise<ISMEventType> => {
        const message = context.message
        if (message == null) {
            this.logger.error("message cannot be null in executeHomeState({ context }: { context: ISMContext})")
            throw new Error("message cannot be null in executeHomeState({ context }: { context: ISMContext})")
        }
        switch (message.type) {
            case "text":
                // process text via llm
                let messageBody = message.text.body
                if (message.referral) {
                    messageBody = `Context:\nClient used whatsapp link on advert to send message. Advert heading: "${message.referral.headline}" and content: "${message.referral.body}"\nClient's message:\n${message.text.body}`
                }
                this.llmQueueService.sendPlainTextToLLM(context.wabaId, context.metadata, context.contact, messageBody)
                return {type: "nochange"}
            
            case "interactive":
                switch (message.interactive.type) {
                    case "list_reply":
                        // menu selection
                        switch (message.interactive.list_reply.id) {
                            case MainMenuItems[0].id:
                                return { type: "products" }
                            case MainMenuItems[1].id:
                                return { type: "preferences" }
                            // case MainMenuItems[2].id:
                            //     sendTextMessage(context, this.clientsService, `Sorry, this menu option (${MainMenuItems[2].title}) is still under development.`)
                            //     return {type: "nochange"}
                            default:
                        }
                    default:
                }
            default:
                sendTextMessage(context, this.clientsService, `Sorry, the type of message you sent is either not supported or invalid menu selection.`)
                return {type: "nochange"}
        }
    }

}