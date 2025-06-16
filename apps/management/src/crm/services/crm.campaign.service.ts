import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Logger } from "winston";
import { Campaign } from "../entities/campaign.entity";
import { EntityNotFoundError, Repository } from "typeorm";
import { LoggingService } from "@lib/logging";
import { CreateCampaignDto } from "../dto/create-campaign.dto";
import { Customer } from "../entities/customer.entity";
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies";
import { CampaignLaunchEventPattern, CampaignLaunchEventPayload, CampaignMessageStatusUpdatePayload, MessengerEventPattern, MessengerRMQMessage } from "@lib/thuso-common";
import { CampaignMessage } from "../entities/campaign-message.entity";
import { IExternBusinessService } from "../../businesses/interfaces/iexternbusiness.service";
import { EditCampaignDto } from "../dto/edit-campaign.dto";

@Injectable()
export class CampaignService {
    private readonly logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @InjectRepository(Campaign)
        private readonly campaignRepository: Repository<Campaign>,
        @InjectRepository(CampaignMessage)
        private readonly campaignMessageRepository: Repository<CampaignMessage>,
        @InjectRepository(Customer)
        private readonly customerRepository: Repository<Customer>,
        private readonly clientService: ThusoClientProxiesService,
        @Inject("IExternBusinessService")
        private readonly businessService: IExternBusinessService
    ) {
        this.logger = this.loggingService.getLogger({
            file: "crm.campaign.service.ts",
            module: "crm"
        });

        this.logger.info("Campaign Service initialized");
    }

    /**
     * This method creates a new campaign in the database
     * It takes an accountId and a CreateCampaignDto object as parameters
     * It returns a promise that resolves to an object containing the success status and optionally the campaign id or an error message
     * @param accountId - The ID of the account creating the campaign
     * @param data - The data for the campaign to be created
     * @return A promise that resolves to an object containing the success status and optionally the campaign id or an error message
    */
    async createCampaign(accountId: string, data: CreateCampaignDto): Promise<{ success: boolean, id?: string, error?: string }> {
        try {
            const business = await this.businessService.getBusinessByWabaId(data.wabaId)
            if (!business) {
                return { success: false, error: "Invalid WABA ID!" }
            }

            const campaign = this.campaignRepository.create({
                accountId,
                ...data,
                dailyMessageLimit: business.businessInitiaitedMessageLimit
            });
            
            const savedCampaign = await this.campaignRepository.save(campaign);

            if (savedCampaign.biller === "whatsapp") {
                if (savedCampaign.unfilteredClients) {
                    this.logger.info("Campaign created with unfiltered clients")
                    // Handle unfiltered clients logic here

                    await this.campaignRepository.update({ id: savedCampaign.id }, { approved: true });

                    this.clientService.emitMgntQueue(
                        CampaignLaunchEventPattern,
                        {
                            campaignId: savedCampaign.id
                        } as CampaignLaunchEventPayload
                    )
                }
            }
            return { success: true, id: savedCampaign.id };
        } catch (error) {
            this.logger.error("Error creating campaign", { error });
            return { success: false, error: error.message };
        }
    }

    /**
     * This method lists campaigns for a given account
     * It takes an accountId, and optional skip and take parameters for pagination
     * It returns a promise that resolves to an array containing the campaigns and the total count of campaigns
     * @param accountId - The ID of the account whose campaigns are to be listed
     * @param skip - The number of campaigns to skip (for pagination)
     * @param take - The number of campaigns to take (for pagination)
     * @return A promise that resolves to an array containing the campaigns and the total count of campaigns
    */
    async listCampaigns(accountId: string, skip?: number, take?: number): Promise<[Campaign[], number]> {
        try {
            const [campaigns, total] = await this.campaignRepository.findAndCount({
                where: { accountId },
                skip: skip || 0,
                take: take || 10,
                order: { createdAt: "DESC" }
            });
            return [campaigns, total];
        } catch (error) {
            this.logger.error("Error listing campaigns", { error });
            throw new HttpException("Error listing campaigns", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * This method retrieves a campaign by its ID
     * It takes an accountId and a campaignId as parameters
     * It returns a promise that resolves to the campaign if found, or throws an error if not found
     * @param accountId - The ID of the account to which the campaign belongs
     * @param campaignId - The ID of the campaign to be retrieved
     * @return A promise that resolves to the campaign if found, or throws an error if not found
    */
    async getCampaignById(accountId: string, campaignId: string): Promise<Campaign> {
        try {
            return await this.campaignRepository.findOneByOrFail({ accountId, id: campaignId });
        } catch (error) {
            this.logger.error("Error retrieving campaign by ID", { error, accountId, campaignId });
            if (error instanceof EntityNotFoundError) {
                throw new HttpException("Campaign not found", HttpStatus.NOT_FOUND);
            }
            throw new HttpException("Error retrieving campaign", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async editCampaign(accountId: string, campaignId: string, data: EditCampaignDto) {
        try {
            return await this.campaignRepository.update({ id: campaignId, accountId }, { totalMessageLimit: data.totalMessageLimit })
        } catch (error) {
            this.logger.error("", { accountId, campaignId, error})
            throw new HttpException("Error while updating campaign", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    /*
     * This method asynchrously queues up jobs for the whatsapp messenger
     * Whatsapp messenger will send the messages to clients via the whatsapp api
     * This method retrieves the customers from the database in batches and dispatches messages for each customer
     * Messages are dispatched until the total message limit or daily messaging limit is reached
     * Messages are dispatched using rabbitmq (currently) or any other message queue service (possibly in the future)
    */
    async setUpCampaignMessageQueue(campaignId: string): Promise<void> {
        try {
            const campaign = await this.campaignRepository.findOne({ where: { id: campaignId } });
            if (!campaign) {
                this.logger.error("Campaign not found", { campaignId });
            }

            const totalMessages = campaign.totalMessageLimit > campaign.dailyMessageLimit ? campaign.dailyMessageLimit : campaign.totalMessageLimit;
            let dispatchedMessages = 0;
            let failedDispatches = 0;

            this.logger.info("Dispatching messages for campaign", { campaignId, totalMessages });

            while (dispatchedMessages < totalMessages) {
                const clients = await this.customerRepository.find({ where: { accountId: campaign.accountId, prefs: { whatsAppPromo: true } }, skip: dispatchedMessages, take: 50 })

                if (clients.length === 0) {
                    this.logger.info("No more clients to process for campaign", { campaignId });
                    break;
                }

                for (const client of clients) {
                    try {
                        this.clientService.emitWhatsappQueue(
                            MessengerEventPattern,
                            {
                                wabaId: campaign.wabaId,
                                type: "message-body",
                                metadata: {
                                    phone_number_id: campaign.phoneNumberId,
                                    display_phone_number: ""
                                },
                                contact: {
                                    profile: {
                                        name: ""
                                    },
                                    wa_id: client.whatsAppNumber
                                },
                                messageBody: {
                                    messaging_product: "whatsapp",
                                    to: client.whatsAppNumber,
                                    recipient_type: "individual",
                                    type: "template",
                                    template: {
                                        name: campaign.templateName,
                                        language: {
                                            code: "en_US"
                                        },
                                        components: campaign.components
                                    }
                                },
                                conversationType: "marketing",
                                campaignId: campaign.id
                            } as MessengerRMQMessage
                        )
                    } catch (error) {
                        this.logger.error("Error dispatching message", { error, clientId: client.id, campaignId });
                        failedDispatches++
                    } finally {
                        dispatchedMessages++
                    }
                }

            }

            campaign.dispatchedMessages += dispatchedMessages;
            campaign.failedDispatches += failedDispatches;
            await this.campaignRepository.save(campaign);
        } catch (error) {
            this.logger.error("Error setting up campaign message queue", { error });
        }
    }

    /**
     * This method handles the campaign message status updates from the whatsapp messenger
     * It updates the campaign message status in the database and increments the respective counters
     * @param payload - The payload containing the message status update
     */
    async handleCampaignMessageStatusUpdate(payload: CampaignMessageStatusUpdatePayload) {
        try {
            switch (payload.status) {
                case "sent":
                    const message = await this.campaignMessageRepository.findOneBy({ wamid: payload.messageId });
                    if (!message) {
                        // If the message does not exist, we can create a new one
                        await this.campaignMessageRepository.save(
                            this.campaignMessageRepository.create({
                                wamid: payload.messageId,
                                status: payload.status,
                                campaign: await this.campaignRepository.findOneBy({ id: payload.campaignId }),
                            })
                        )

                        // increment sent messages count
                        await this.campaignRepository.update({ id: payload.campaignId }, { totalMessagesSent: () => `"totalMessagesSent" + 1` });
                        break;
                    }

                    // If the message exists, we update its status
                    message.status = payload.status;
                    await this.campaignMessageRepository.save(message);
                    break;

                case "delivered":
                    await this.campaignMessageRepository.update({ wamid: payload.messageId }, { status: payload.status });
                    await this.campaignRepository.update({ id: payload.campaignId }, { totalMessagesDelivered: () => `"totalMessagesDelivered" + 1` });
                    break;

                case "read":
                    await this.campaignMessageRepository.update({ wamid: payload.messageId }, { status: payload.status });
                    await this.campaignRepository.update({ id: payload.campaignId }, { totalMessagesRead: () => `"totalMessagesRead" + 1` });
                    break;

                case "failed":
                    if (payload.messageId) await this.campaignMessageRepository.update({ wamid: payload.messageId }, { status: payload.status });
                    await this.campaignRepository.update({ id: payload.campaignId }, { totalMessagesFailed: () => `"totalMessagesFailed" + 1` });
                    break;

                default:
                    this.logger.warn("Unhandled campaign message status", { status: payload.status, messageId: payload.messageId, campaignId: payload.campaignId });
                    break;
            }
        } catch (error) {
            this.logger.error("Error handling campaign message status update", { error, payload });
        }
    }
}