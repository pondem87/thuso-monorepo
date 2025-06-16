import { LoggingService } from "@lib/logging";
import { CampaignLaunchEventPattern, CampaignLaunchEventPayload, CampaignMessageStatusUpdateEventPattern, CampaignMessageStatusUpdatePayload } from "@lib/thuso-common";
import { Controller } from "@nestjs/common";
import { EventPattern, Payload } from "@nestjs/microservices";
import { Logger } from "winston";
import { CampaignService } from "../services/crm.campaign.service";

@Controller()
export class CampaignRmqController {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly campaignService: CampaignService
    ) {
        // Initialize the logger here if needed
        this.logger = this.loggingService.getLogger({
            file: "crm.campaign.rmq.controller.ts",
            module: "crm"
        });

        this.logger.info("Campaign RMQ Controller initialized");
    }

    @EventPattern(CampaignMessageStatusUpdateEventPattern)
    handleCampaignMessageStatusUpdate(
        @Payload() payload: CampaignMessageStatusUpdatePayload
    ) {
        this.logger.debug("Received Campaign Message Status Update", {
            payload
        });

        return this.campaignService.handleCampaignMessageStatusUpdate(payload);
    }

    @EventPattern(CampaignLaunchEventPattern)
    handleCampaignLaunch(
        @Payload() payload: CampaignLaunchEventPayload
    ) {
        this.logger.info("Launching campaign")

        return this.campaignService.setUpCampaignMessageQueue(payload.campaignId);
    }
}