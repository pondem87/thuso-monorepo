import { LoggingService } from "@lib/logging"
import { InteractiveList, MessengerEventPattern, MessengerRMQMessage, WhatsappRmqClient } from "@lib/thuso-common"
import { Inject, Injectable } from "@nestjs/common"
import { ClientProxy } from "@nestjs/microservices"
import { Logger } from "winston"
import { ISMContext, ISMEventType } from "../state-machines/interactive.state-machine.provider"
import { ConfigService } from "@nestjs/config"
import { sendListMessage, sendTextMessage } from "./shared"

@Injectable()
export class ProductsStateService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @Inject(WhatsappRmqClient)
        private readonly whatsappQueueClient: ClientProxy,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "products-state.service"
        })

        this.logger.info("Initializing HomeStateService")
    }

    promptProductsMenuState = async ({ context }: { context: ISMContext }): Promise<void> => {
        const [products, total] = await this.fetchProducts(context, "first")

        const skip = 0
        const current = (skip / context.productsNav.take) + 1
        const pages = Math.ceil(total / context.productsNav.take)

        sendListMessage(context, this.whatsappQueueClient, this.compileInteractiveList(products, current, pages))
    }

    executeProductsMenuItem = async ({ context }: { context: ISMContext }): Promise<ISMEventType> => {
        const message = context.message
        if (message == null) {
            this.logger.error("message cannot be null in executeHomeState({ context }: { context: ISMContext})")
            throw new Error("message cannot be null in executeHomeState({ context }: { context: ISMContext})")
        }

        switch (message.type) {
            case "interactive":
                switch (message.interactive.type) {
                    case "list_reply":
                        // menu selection
                        switch (message.interactive.list_reply.id) {
                            case productsMenuItems[0].id:
                                const [nextProducts, nextTotal] = await this.fetchProducts(context, "next")

                                const nSkip = context.productsNav.skip + context.productsNav.take
                                const nCurrent = (nSkip / context.productsNav.take) + 1
                                const nPages = Math.ceil(nextTotal / context.productsNav.take)

                                sendListMessage(context, this.whatsappQueueClient, this.compileInteractiveList(nextProducts, nCurrent, nPages))

                                return { type: "navigateProducts", nav: { skip: nSkip, take: context.productsNav.take, current: nCurrent, pages: nPages } }
                            case productsMenuItems[1].id:
                                const [prevProducts, prevTotal] = await this.fetchProducts(context, "next")

                                const pSkip = context.productsNav.skip + context.productsNav.take
                                const pCurrent = (pSkip / context.productsNav.take) + 1
                                const pPages = Math.ceil(prevTotal / context.productsNav.take)

                                sendListMessage(context, this.whatsappQueueClient, this.compileInteractiveList(prevProducts, pCurrent, pPages))

                                return { type: "navigateProducts", nav: { skip: pSkip, take: context.productsNav.take, current: pCurrent, pages: pPages } }
                            case productsMenuItems[1].id:
                                return { type: "exitProducts" }
                            default:
                        }
                    default:
                        sendTextMessage(context, this.whatsappQueueClient, `Sorry, the message you sent is not valid. Select an option from Products Menu.`)
                        return { type: "nochange" }
                }

            default:
                const messageDefaultMessage: MessengerRMQMessage = {
                    metadata: context.metadata,
                    contact: context.contact,
                    type: "text",
                    conversationType: "service",
                    text: `Sorry, the message type is not supported.`
                }
                this.whatsappQueueClient.emit(
                    MessengerEventPattern,
                    messageDefaultMessage
                )
                return { type: "nochange" }
        }

    }

    async fetchProducts(context: ISMContext, mode: "next" | "prev" | "first"): Promise<[Product[], number] | null> {
        try {
            const businessProfileIdResponse = await fetch(
                `http://${this.configService.get<string>("MANAGEMENT_SERVER_URL")}:${this.configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/${context.wabaId}/businesses/profile`
            )

            if (!businessProfileIdResponse.ok) {
                this.logger.error("Failed to get business profile", { response: businessProfileIdResponse })
                throw new Error("Failed to get business profile")
            }

            const profileId = (await businessProfileIdResponse.json()).id

            let skip: number

            switch (mode) {
                case "next":
                    skip = context.productsNav.skip + context.productsNav.take
                    break;

                case "next":
                    skip = context.productsNav.skip - context.productsNav.take
                    break;

                default:
                    skip = 0
                    break;
            }

            const result = await fetch(
                `http://${this.configService.get<string>("MANAGEMENT_SERVER_URL")}:${this.configService.get<string>("THUSO_S2S_TOKEN")}/api/${profileId}/products?skip=${skip}&take=${context.productsNav.take}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`
                    }
                }
            )

            if (!result.ok) {
                this.logger.error("Failed to get business profile", { response: businessProfileIdResponse })
                throw new Error("Failed to get business profile")
            }

            return await result.json() as [Product[], number]
        } catch (error) {
            this.logger.error("Failed to get products", { context })
            return null
        }
    }

    compileInteractiveList(
        products: Product[],
        page: number,
        pages: number
    ): InteractiveList {

        const options = []

        if (page < pages) {
            options.push(productsMenuItems[0])
        }

        if (page > 1) {
            options.push(productsMenuItems[1])
        }

        options.push(productsMenuItems[2])

        return {
            type: "list",
            header: {
                type: "text",
                text: "Products"
            },
            body: {
                text: "Here is a list of our products."
            },
            footer: {
                text: ""
            },
            action: {
                sections: [{
                    title: `Products (page ${page} of ${pages})`,
                    rows: products.map((product) => ({
                        id: product.id,
                        title: product.name,
                        description: product.description
                    }))
                }, {
                    title: "Options",
                    rows: options
                }],
                button: "View Products"
            }
        }
    }

}

export const productsMenuItems = [
    {
        id: "navigate-next",
        title: "Next Page",
        description: "List more products"
    },
    {
        id: "navigate-prev",
        title: "Previous Page",
        description: "View previous products"
    },
    {
        id: "exit-products",
        title: "Back To Home",
        description: "Go back to chat."
    }
]

export type Product = {
    id: string
    accountId: string
    businessProfileId: string
    name: string
    description: string
    price: string
    mimetype: string
    s3key: string
    createdAt: Date
    updatedAt: Date
}