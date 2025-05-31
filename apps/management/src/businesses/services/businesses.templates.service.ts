import { LoggingService } from "@lib/logging";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Logger } from "winston";
import { WhatsAppTemplate } from "../entities/whatsapp-template.entity";
import { DeleteResult, EntityNotFoundError, Repository } from "typeorm";
import { WhatsAppBusiness } from "../entities/whatsapp-business.entity";
import { CreateWhatsAppTemplateDto } from "../dto/create-template.dto";
import { EditWhatsAppTemplateDto } from "../dto/edit-template.dto";
import { APIError, generateRandomString, GraphAPIService, MessengerEventPattern, MessengerRMQMessage, TemplateQualityEventPayload, TemplateStatus, TemplateUpdateEventPayload } from "@lib/thuso-common";
import { ConfigService } from "@nestjs/config";
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies";
import { SendTemplDto } from "../dto/send-template.dto";
import { WhatsAppNumber } from "../entities/whatsapp-number.entity";
import { GetObjectCommand, HeadObjectCommand, S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetMediaIdDto } from "../dto/get-media-id.dto";
import { GetMediaHandleDto } from "../dto/get-media-handle.dto";
import axios from "axios";

/*
 * Implements the WhatsApp Template Service for managing WhatsApp templates.
 * Provides methods for creating, retrieving, updating, and deleting templates,
 * Assists the templates controllers i.e REST API and RabbitMQ handlers.
*/
@Injectable()
export class WhatsAppTemplateService {
    private logger: Logger
    private s3Client: S3Client;
    private s3BucketName: string;

    constructor(
        private readonly loggingService: LoggingService,
        @InjectRepository(WhatsAppTemplate)
        private readonly templateRepo: Repository<WhatsAppTemplate>,
        @InjectRepository(WhatsAppBusiness)
        private readonly whatsappBusinessRepo: Repository<WhatsAppBusiness>,
        @InjectRepository(WhatsAppNumber)
        private readonly whatsappNumberRepo: Repository<WhatsAppNumber>,
        private readonly configService: ConfigService,
        private readonly clientsService: ThusoClientProxiesService,
        private readonly graphAPIService: GraphAPIService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "businesses",
            file: "businesses.templates.service"
        })

        this.logger.info("Initialised WhatsApp Templates Service")

        const s3Config: S3ClientConfig = {
            credentials: {
                accessKeyId: this.configService.get<string>("S3_ACCESS_KEY_ID"), // 'your-access-key-id'
                secretAccessKey: this.configService.get<string>("S3_SECRET_ACCESS_KEY"), // 'your-secret-access-key'
            },
            region: this.configService.get<string>("S3_REGION"), // 'region',
        }

        this.s3Client = new S3Client(s3Config);
        this.s3BucketName = this.configService.get<string>("S3_BUCKET_NAME")
    }

    async getTemplate(accountId: string, id: string): Promise<WhatsAppTemplate> {
        try {
            let template = await this.templateRepo.findOneByOrFail({ accountId, id })

            if (template.status !== "APPROVED") {
                const waba = await this.whatsappBusinessRepo.findOneBy({accountId, wabaId: template.wabaId })
                // code to delete from whatsapp
                const tempRes = await fetch(
                    `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/${waba.wabaId}/message_templates`,
                    {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${waba.wabaToken}`
                        }
                    }
                )

                if (!tempRes.ok) {
                    const error = await tempRes.json()
                    this.logger.error("Failed to delete template", { error, response: tempRes })
                    throw new Error("Failed to delete template")
                }

                const data: any[] = (await tempRes.json())?.data
                const status = data.find((item) => item["id"] === template.templateId)?.status

                if (status) {
                    template.status = status
                    template = await this.templateRepo.save(template)
                }
            }

            return template
        } catch (error) {
            if (error instanceof EntityNotFoundError) {
                throw new HttpException("Not found!", HttpStatus.NOT_FOUND)
            }
            this.logger.error("Error while retrieving template", { accountId, error })
            throw new HttpException(`Error while retrieving template`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async listTemplates(accountId: string, skip?: number | undefined, take?: number | undefined) {
        try {
            return await this.templateRepo.findAndCount({ where: { accountId }, skip, take })
        } catch (error) {
            this.logger.error("Error while retrieving template list", { accountId, error })
            throw new HttpException(`Error while retrieving template list`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async createTemplate(accountId: string, dto: CreateWhatsAppTemplateDto):
        Promise<{ 
            success: boolean,
            template?: WhatsAppTemplate,
            reason?: string
        }> {
        try {
            const waba = await this.whatsappBusinessRepo.findOne({ where: { accountId, wabaId: dto.wabaId } })
            if (!waba) {
                throw new Error("The WABA does not exist.")
            }

            const template = await this.templateRepo.save(
                this.templateRepo.create({
                    accountId,
                    ...dto
                })
            )

            const tempRes = await fetch(
                `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/${waba.wabaId}/message_templates`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${waba.wabaToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(template.template)
                }
            )

            if (!tempRes.ok) {
                const data = await tempRes.json()
                this.logger.error("Failed to submit template for creatiion", { data, response: tempRes })
                await this.templateRepo.delete(template)
                if (data.error) {
                    const error = data.error as APIError
                    if (error.error_user_title || error.error_user_msg) {
                        return {
                            success: false,
                            reason: `${error.error_user_title}${error.error_user_msg}`
                        }
                    }
                }
                throw new Error("Graph API failure")
            } else {
                const data = await tempRes.json() as { id: string, status: TemplateStatus, category: "UTILITY" | "MARKETING" | "AUTHENTICATION" }
                template.templateId = data.id
                template.status = data.status
                template.template.category = data.category
                const newTemplate = await this.templateRepo.save(template)
                return {
                    success: true,
                    template: newTemplate
                }
            }
        } catch (error) {
            this.logger.error("Failed to create whatsapp template", { accountId, dto, error })
            throw new HttpException("Failed to create template", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async editTemplate(accountId: string, id: string, dto: EditWhatsAppTemplateDto): Promise<WhatsAppTemplate> {
        try {
            let template = await this.templateRepo.findOne({ where: { accountId, id } })
            if (!template) {
                throw new Error("The template does not exist.")
            }

            const waba = await this.whatsappBusinessRepo.findOne({ where: { accountId, wabaId: template.wabaId } })
            if (!waba) {
                throw new Error("The WABA does not exist.")
            }

            template.template = dto.template

            // post to graph api
            const tempRes = await fetch(
                `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/${waba.wabaId}/message_templates`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${waba.wabaToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(template.template)
                }
            )

            if (!tempRes.ok) {
                const error = await tempRes.json()
                this.logger.error("Failed to submit template for creation", { error, response: tempRes })
                throw new Error("Graph API Error")
            } else {
                const data = await tempRes.json() as { id: string, status: TemplateStatus, category: "UTILITY" | "MARKETING" | "AUTHENTICATION" }

                template.templateId = data.id
                template.status = data.status
                template.template.category = data.category

                return await this.templateRepo.save(template)
            }
        } catch (error) {
            this.logger.error("Failed to edit whatsapp template", { accountId, error })
            throw new HttpException("Failed to edit template", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async deleteTemplate(accountId: string, id: string): Promise<DeleteResult> {
        try {
            let template = await this.templateRepo.findOne({ where: { accountId, id } })
            if (!template) {
                throw new Error("The template does not exist.")
            }

            const waba = await this.whatsappBusinessRepo.findOneBy({ accountId, wabaId: template.wabaId })
            if (!waba) {
                throw new Error("The WABA does not exist.")
            }

            // code to delete from whatsapp
            const tempRes = await fetch(
                `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/${waba.wabaId}/message_templates?name=${template.template.name}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${waba.wabaToken}`
                    }
                }
            )

            if (!tempRes.ok) {
                const error = await tempRes.json()
                this.logger.error("Failed to delete template", { error, response: tempRes })
                throw new Error("Failed to delete template")
            }

            return await this.templateRepo.delete({ accountId, id })
        } catch (error) {
            this.logger.error("Failed to delete whatsapp template", { accountId, error })
            throw new HttpException("Failed to delete template", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async processTemplateUpdate(data: TemplateUpdateEventPayload) {
        try {
            await this.templateRepo.update(
                {
                    templateId: data.update.message_template_id, wabaId: data.wabaId
                },
                {
                    status: data.update.event,
                    reason: data.update.reason,
                    otherInfo: data.update.other_info || data.update.disable_info ? JSON.stringify(data.update.other_info || data.update.disable_info) : null
                }
            )
        } catch (error) {
            this.logger.error("Error while processing template update", { error, data })
        }
    }

    async processTemplateQualityUpdate(data: TemplateQualityEventPayload) {
        try {
            await this.templateRepo.update(
                {
                    templateId: data.update.message_template_id, wabaId: data.wabaId
                },
                {
                    quality: data.update.new_quality_score
                }
            )
        } catch (error) {
            this.logger.error("Error while processing template update", { error, data })
        }
    }

    async sendTemplMessage(accountId: string, templateId: string, data: SendTemplDto) {
        try {
            const template = await this.templateRepo.findOneByOrFail({ accountId, id: templateId })

            const appNumber = await this.whatsappNumberRepo.findOneByOrFail({ accountId, waba: { wabaId: template.wabaId }, appNumberId: data.phoneNumberId })

            this.clientsService.emitWhatsappQueue(
                MessengerEventPattern,
                {
                    wabaId: template.wabaId,
                    metadata: {
                        display_phone_number: appNumber.appNumber,
                        phone_number_id: appNumber.appNumberId
                    },
                    type: "message-body",
                    conversationType: "marketing",
                    contact: {
                        profile: {
                            name: ""
                        },
                        wa_id: template.wabaId
                    },
                    messageBody: {
                        messaging_product: "whatsapp",
                        recipient_type: "individual",
                        to: data.phoneNumber.replace(/^\+/, ''),
                        type: "template",
                        template: {
                            name: template.template.name,
                            language: {
                                code: "en_US"
                            },
                            components: data.components,
                        }
                    }
                } as MessengerRMQMessage
            )
            return { success: true }
        } catch (error) {
            if (error instanceof EntityNotFoundError) {
                this.logger.warn("Failed to send test message", { error, accountId, data })
                throw new HttpException("Used nonexisting wabaId or phone number", HttpStatus.NOT_FOUND)
            }
            this.logger.error("Failed to send test message", { error, accountId, data })
            throw new HttpException("Failed to send message", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getPhoneNumbers(accountId: string, wabaId: string) {
        try {
            return await this.whatsappNumberRepo.find({ where: { accountId, waba: { wabaId } } })
        } catch (error) {
            this.logger.error("Error fetching phone-numbers", { accountId, wabaId })
            throw new HttpException("Failed to get phonenumbers", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    /**
     * Generates a whatsapp media ID for the given media file stored in S3 for attaching media to whatsapp messages.
     * @param accountId - The account ID of the user.
     * @param dto - The DTO containing WABA ID, S3 key, media type, and phone number ID.
     * @returns A promise that resolves to the media ID.
     */
    async getMediaId(accountId: string, { wabaId, mediaS3key, mediatype, phoneNumberId }: GetMediaIdDto) {
        try {
            const business = await this.whatsappBusinessRepo.findOneByOrFail({ accountId, wabaId })
            const signeUrl = await getSignedUrl(
                this.s3Client,
                new GetObjectCommand({
                    Bucket: this.s3BucketName,
                    Key: mediaS3key
                }),
                { expiresIn: 300 }
            )

            return await this.graphAPIService.uploadMedia(business.wabaToken, phoneNumberId, mediatype, signeUrl)
        } catch (error) {
            this.logger.error("Failed to generate media id", { accountId, wabaId, phoneNumberId })
            throw new HttpException("Failed to get Media ID", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    /**
     * Generates a media handle using resumable upload api for the given media file stored in S3.
     * This is used to attach media to whatsapp templates
     * @param accountId - The account ID of the user.
     * @param dto - The DTO containing WABA ID, S3 key, file size, and MIME type.
     * @returns A promise that resolves to the media handle.
     */
    async getMetaMediaHandle(accountId: string, { s3key, fileSize, wabaId, mimetype }: GetMediaHandleDto): Promise<string> {
        try {
            const waba = await this.whatsappBusinessRepo.findOneBy({ accountId, wabaId })
            const filename = generateRandomString(10, "alpha")
            const query = `?file_name=${filename}&file_length=${fileSize}&file_type=${encodeURIComponent(mimetype)}&access_token=${encodeURIComponent(waba.wabaToken)}`

            // register phone number
            const sessionResponse = await fetch(
                `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/${this.configService.get<string>("META_APP_ID")}/uploads${query}`,
                {
                    method: "POST"
                }
            )

            if (!sessionResponse.ok) {
                this.logger.error("Failed to get session Id for media upload", { response: sessionResponse, error_data: await sessionResponse.json() })
            }

            const sessionId = (await sessionResponse.json()).id as string

            const head = await this.s3Client.send(
                new HeadObjectCommand({
                    Bucket: this.s3BucketName,
                    Key: s3key
                })
            );

            /*
             * Posting a stream with axios requires the content length so we get that and them open the readstream
            */
            const contentLength = head.ContentLength;

            const s3resp = await this.s3Client.send(
                new GetObjectCommand({
                    Bucket: this.s3BucketName,
                    Key: s3key
                })
            )


            /*
             * Directly pass in the readstream as the data to axios post
             * Here we upload a media file to the resumable upload api
            */
            const uploadResult = await axios.post(
                `${this.configService.get<string>("FACEBOOK_GRAPH_API")}/${sessionId}`,
                s3resp.Body,
                {
                    headers: {
                        'Authorization': `OAuth ${waba.wabaToken}`,
                        'file_offset': '0',
                        'Content-Type': mimetype,
                        'Content-Length': contentLength?.toString()
                    }
                }
            )

            if (uploadResult.status >= 400) {
                this.logger.error("Failed to get session Id for media upload", { response: uploadResult, error_data: await uploadResult.data })
                throw new Error("Failed to generate media handle")
            }

            return (await uploadResult.data).h as string

        } catch (error) {
            this.logger.error("Error while generating media handle", { error })
            throw new HttpException("Failed to generate media handle.", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}