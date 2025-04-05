import { LoggingService } from "@lib/logging"
import { CHAR_LIMITS, cropTextToLength, GraphAPIService, InteractiveList, InteractiveReplyButtons, MessengerEventPattern, MessengerRMQMessage, WHATSAPP_DOCS_MIMETYPES, WHATSAPP_IMAGES_MIMETYPES, WhatsappRmqClient } from "@lib/thuso-common"
import { Inject, Injectable } from "@nestjs/common"
import { ClientProxy } from "@nestjs/microservices"
import { Logger } from "winston"
import { ISMContext, ISMEventType } from "../state-machines/interactive.state-machine.provider"
import { ConfigService } from "@nestjs/config"
import { sendInteractiveReplyButtonsMessage, sendListMessage, sendTextMessage } from "./shared"

@Injectable()
export class ProductsStateService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @Inject(WhatsappRmqClient)
        private readonly whatsappQueueClient: ClientProxy,
        private readonly configService: ConfigService,
        private readonly graphAPIService: GraphAPIService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "products-state.service"
        })

        this.logger.info("Initializing HomeStateService")
    }

    promptProductsMenuState = async ({ context }: { context: ISMContext }): Promise<void> => {
        const [products, total] = await this.fetchProducts(context, "first")

        const skip = context.productsNav.skip
        const current = (skip / context.productsNav.take) + 1
        const pages = Math.ceil(total / context.productsNav.take)

        sendListMessage(context, this.whatsappQueueClient, this.compileInteractiveList(context, products, current, pages))
    }

    executeProductsMenuItem = async ({ context }: { context: ISMContext }): Promise<ISMEventType> => {
        const message = context.message
        if (message == null) {
            this.logger.error("message cannot be null in executeProductsMenuItem({ context }: { context: ISMContext})")
            throw new Error("message cannot be null in executeProductsMenuItem({ context }: { context: ISMContext})")
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

                                sendListMessage(context, this.whatsappQueueClient, this.compileInteractiveList(context, nextProducts, nCurrent, nPages))

                                return { type: "navigateProducts", nav: { skip: nSkip, take: context.productsNav.take, current: nCurrent, pages: nPages } }
                            case productsMenuItems[1].id:
                                const [prevProducts, prevTotal] = await this.fetchProducts(context, "next")

                                const pSkip = context.productsNav.skip + context.productsNav.take
                                const pCurrent = (pSkip / context.productsNav.take) + 1
                                const pPages = Math.ceil(prevTotal / context.productsNav.take)

                                sendListMessage(context, this.whatsappQueueClient, this.compileInteractiveList(context, prevProducts, pCurrent, pPages))

                                return { type: "navigateProducts", nav: { skip: pSkip, take: context.productsNav.take, current: pCurrent, pages: pPages } }
                            case productsMenuItems[1].id:
                                sendTextMessage(context, this.whatsappQueueClient, "You have exited the products menu.")
                                return { type: "exitProducts" }
                            default:
                                const product = await this.fetchProduct(context, message.interactive.list_reply.id)
                                if (product) {
                                    sendInteractiveReplyButtonsMessage(context, this.whatsappQueueClient, await this.compileProductMessage(context, product))
                                    return { type: "viewProduct", productId: product.id }
                                }
                        }
                    default:
                        sendTextMessage(context, this.whatsappQueueClient, `Sorry, the message you sent is not valid. Select an option from Products Menu.`)
                        return { type: "nochange" }
                }

            default:
                const messageDefaultMessage: MessengerRMQMessage = {
                    wabaId: context.wabaId,
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

    executeProductView = async ({ context }: { context: ISMContext }): Promise<ISMEventType> => {
        const message = context.message
        if (message == null) {
            this.logger.error("message cannot be null in executeProductView({ context }: { context: ISMContext})")
            throw new Error("message cannot be null in executeProductView({ context }: { context: ISMContext})")
        }

        switch (message.type) {
            case "interactive":
                switch (message.interactive.type) {
                    case "button_reply":
                        switch (message.interactive.button_reply.id) {
                            case moreDetailsId:
                                const product = await this.fetchProduct(context, context.productId)
                                if (product) {
                                    sendTextMessage(
                                        context,
                                        this.whatsappQueueClient,
                                        `*${product.name}*\n${product.fullDetails}\n\n*Price: ${product.price}*`
                                    )
                                    return { type: "navigateProducts", nav: context.productsNav }
                                }
                            case backToListId:
                                return { type: "navigateProducts", nav: context.productsNav }
                        }
                    default:
                }
            default:
                return { type: "navigateProducts", nav: context.productsNav }
        }
    }

    async fetchProducts(context: ISMContext, mode: "next" | "prev" | "first"): Promise<[Product[], number] | null> {
        try {
            const businessProfileIdResponse = await fetch(
                `http://${this.configService.get<string>("MANAGEMENT_SERVER_URL")}:${this.configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/businesses/${context.wabaId}/profile`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`
                    }
                }
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

                case "prev":
                    skip = context.productsNav.skip - context.productsNav.take
                    break;

                default:
                    skip = context.productsNav.skip
                    break;
            }

            const result = await fetch(
                `http://${this.configService.get<string>("MANAGEMENT_SERVER_URL")}:${this.configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/${profileId}/products?skip=${skip}&take=${context.productsNav.take}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`
                    }
                }
            )

            if (!result.ok) {
                this.logger.error("Failed to get products", { response: await result.json() })
                return null
            }

            return await result.json() as [Product[], number]

        } catch (error) {
            this.logger.error("Failed to get products", { context, error })
            return null
        }
    }

    async fetchProduct(context: ISMContext, productId: string) {
        try {
            const businessProfileIdResponse = await fetch(
                `http://${this.configService.get<string>("MANAGEMENT_SERVER_URL")}:${this.configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/businesses/${context.wabaId}/profile`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`
                    }
                }
            )

            if (!businessProfileIdResponse.ok) {
                this.logger.error("Failed to get business profile", { response: businessProfileIdResponse })
                throw new Error("Failed to get business profile")
            }

            const profileId = (await businessProfileIdResponse.json()).id

            const result = await fetch(
                `http://${this.configService.get<string>("MANAGEMENT_SERVER_URL")}:${this.configService.get<string>("MANAGEMENT_SERVER_PORT")}/api/${profileId}/products/${productId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("THUSO_S2S_TOKEN")}`
                    }
                }
            )

            if (!result.ok) {
                this.logger.error("Failed to get product", { response: await result.json() })
                return null
            }

            return await result.json() as Product

        } catch (error) {
            this.logger.error("Failed to get products", { context, error })
            return null
        }
    }

    compileInteractiveList(
        context: ISMContext,
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
                text: cropTextToLength(`${context.businessInfo.name}: ${context.businessInfo.tagline}`, CHAR_LIMITS.MESSAGE_FOOTER_TEXT)
            },
            action: {
                sections: [{
                    title: cropTextToLength(`Products: page ${page} of ${pages}`, CHAR_LIMITS.SECTION_TITLE_TEXT),
                    rows: products.map((product) => ({
                        id: product.id,
                        title: cropTextToLength(product.name, CHAR_LIMITS.ROW_TITLE_TEXT),
                        description: cropTextToLength(product.shortDescription, CHAR_LIMITS.ROW_DESCRIPTION_TEXT)
                    }))
                }, {
                    title: "Options",
                    rows: options
                }],
                button: "View Products"
            }
        }
    }

    async compileProductMessage(context: ISMContext, product: Product): Promise<InteractiveReplyButtons> {
        let headerType: "image" | "document" | "text" = "text"
        let mediaId: string = null
        let header

        if (WHATSAPP_DOCS_MIMETYPES.includes(product.mimetype)) {
            headerType = "document"
        } else if (WHATSAPP_IMAGES_MIMETYPES.includes(product.mimetype)) {
            headerType = "image"
        }

        // get media id
        if (headerType != "text") {
            mediaId = await this.graphAPIService.uploadMedia(
                context.businessInfo.wabaToken,
                context.metadata.phone_number_id,
                product.mimetype,
                `http://${this.configService.get<string>("MANAGEMENT_SERVER_URL")}:${this.configService.get<string>("MANAGEMENT_SERVER_PORT")}/management/documents/download/${product.s3key}`
            )
        }

        // set header
        if (headerType === "document") {
            header = {
                type: headerType,
                document: {
                    id: mediaId
                }
            }
        } else if (headerType === "image") {
            header = {
                type: headerType,
                image: {
                    id: mediaId
                }
            }
        } else {
            header = {
                type: "text",
                text: cropTextToLength(product.name, CHAR_LIMITS.SECTION_TITLE_TEXT)
            }
        }

        return {
            type: "button",
            header,
            body: {
                text: cropTextToLength(
                    `${product.fullDetails}\n\n*Price: ${product.price}*`,
                    CHAR_LIMITS.BODY_TEXT
                )
            },
            footer: {
                text: cropTextToLength(`${context.businessInfo.name}: ${context.businessInfo.tagline}`, CHAR_LIMITS.MESSAGE_FOOTER_TEXT)
            },
            action: {
                buttons: `${product.fullDetails}\n\n*Price: ${product.price}*`.length > CHAR_LIMITS.BODY_TEXT ? [
                    {
                        type: "reply",
                        reply: {
                            id: moreDetailsId,
                            title: "More Details"
                        }
                    },
                    {
                        type: "reply",
                        reply: {
                            id: backToListId,
                            title: "Back To List"
                        }
                    }
                ] : [
                    {
                        type: "reply",
                        reply: {
                            id: backToListId,
                            title: "Back To List"
                        }
                    }
                ]
            }
        }
    }

}

const moreDetailsId = "more-details"
const backToListId = "back-to-list"


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
    shortDescription: string
    fullDetails: string
    price: string
    mimetype: string
    s3key: string
    createdAt: Date
    updatedAt: Date
}