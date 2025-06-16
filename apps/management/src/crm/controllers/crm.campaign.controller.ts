import { LoggingService } from "@lib/logging";
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { Logger } from "winston";
import { PermissionsGuard } from "../../accounts/permissions-guard";
import { AuthGuard } from "../../auth/auth-guard";
import { PermissionsDecorator } from "../../accounts/permissions.decorator";
import { PermissionAction } from "../../accounts/types";
import { CreateCampaignDto } from "../dto/create-campaign.dto";
import { CampaignService } from "../services/crm.campaign.service";
import { EditCampaignDto } from "../dto/edit-campaign.dto";

@UseGuards(AuthGuard, PermissionsGuard)
@Controller("management/:account/campaign")
export class CampaignController {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly campaignService: CampaignService
    ) {
        // Initialize the logger here if needed
        this.logger = this.loggingService.getLogger({
            file: "crm.campaign.controller.ts",
            module: "crm"
        });

        this.logger.info("Campaign Controller initialized");
    }

    @PermissionsDecorator([
        { entity: "campaign", action: PermissionAction.CREATE }
    ])
    @Post()
    createCampaign(
        @Param('account') account: string,
        @Body() data: CreateCampaignDto
    ) {
        return this.campaignService.createCampaign(account, data)
    }

    @PermissionsDecorator([
        { entity: "campaign", action: PermissionAction.READ }
    ])
    @Get()
    getCampaigns(
        @Param('account') accountId: string,
        @Param('skip', new ParseIntPipe({ optional: true })) skip?: number,
        @Param('take', new ParseIntPipe({ optional: true })) take?: number
    ) {
        return this.campaignService.listCampaigns(accountId, skip, take)
    }

    @PermissionsDecorator([
        { entity: "campaign", action: PermissionAction.READ }
    ])
    @Get(':campaignId')
    getCampaign(
        @Param('account') accountId: string,
        @Param('campaignId') campaignId: string
    ) {
        return this.campaignService.getCampaignById(accountId, campaignId)
    }

    @PermissionsDecorator([
        { entity: "campaign", action: PermissionAction.UPDATE }
    ])
    @Patch(':campaignId')
    patchCampaign(
        @Param('account') accountId: string,
        @Param('campaignId') campaignId: string,
        @Body() data: EditCampaignDto 
    ) {
        return this.campaignService.editCampaign(accountId, campaignId, data)
    }
}