import { LoggingService } from "@lib/logging";
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Logger } from "winston";
import { WhatsAppTemplateService } from "../services/businesses.templates.service";
import { AuthGuard } from "../../auth/auth-guard";
import { PermissionsGuard } from "../../accounts/permissions-guard";
import { PermissionsDecorator } from "../../accounts/permissions.decorator";
import { PermissionAction } from "../../accounts/types";
import { CreateWhatsAppTemplateDto } from "../dto/create-template.dto";
import { EditWhatsAppTemplateDto } from "../dto/edit-template.dto";
import { SendTemplDto } from "../dto/send-template.dto";
import { GetMediaIdDto } from "../dto/get-media-id.dto";
import { GetMediaHandleDto } from "../dto/get-media-handle.dto";

@UseGuards(AuthGuard, PermissionsGuard)
@Controller("management/:account/templates")
export class WhatsAppTemplateController {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly whatsAppTemplateService: WhatsAppTemplateService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "businesses",
            file: "businesses.template.controller"
        })

        this.logger.info("Initialised WhatsApp template controller")
    }

    @PermissionsDecorator([
        { entity: "whatsapp_template", action: PermissionAction.CREATE }
    ])
    @Post()
    createTemplate(
        @Param('account') accountId: string,
        @Body() dto: CreateWhatsAppTemplateDto
    ) {
        return this.whatsAppTemplateService.createTemplate(accountId, dto)
    }

    @PermissionsDecorator([
        { entity: "whatsapp_template", action: PermissionAction.READ }
    ])
    @Get()
    listTemplates(
        @Param('account') accountId: string,
        @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
        @Query('take', new ParseIntPipe({ optional: true })) take?: number
    ) {
        return this.whatsAppTemplateService.listTemplates(accountId, skip, take)
    }

    @PermissionsDecorator([
        { entity: "whatsapp_template", action: PermissionAction.READ }
    ])
    @Get(':template')
    getTemplate(
        @Param('account') accountId: string,
        @Param('template') templateId: string
    ) {
        return this.whatsAppTemplateService.getTemplate(accountId, templateId)
    }

    @PermissionsDecorator([
        { entity: "whatsapp_template", action: PermissionAction.UPDATE }
    ])
    @Patch(':template')
    updateTemplate(
        @Param('account') accountId: string,
        @Param('template') templateId: string,
        @Body() dto: EditWhatsAppTemplateDto
    ) {
        return this.whatsAppTemplateService.editTemplate(accountId, templateId, dto)
    }

    @PermissionsDecorator([
        { entity: "whatsapp_template", action: PermissionAction.DELETE }
    ])
    @Delete(':template')
    deleteTemplate(
        @Param('account') accountId: string,
        @Param('template') templateId: string
    ) {
        return this.whatsAppTemplateService.deleteTemplate(accountId, templateId)
    }

    @PermissionsDecorator([
        { entity: "whatsapp_template", action: PermissionAction.READ }
    ])
    @Post(':template/send')
    sendTemplMessage(
        @Param('account') accountId: string,
        @Param('template') templateId: string,
        @Body() data: SendTemplDto
    ) {
        return this.whatsAppTemplateService.sendTemplMessage(accountId, templateId, data)
    }

    @PermissionsDecorator([
        { entity: "whatsapp_template", action: PermissionAction.READ },
        { entity: "whatsapp_number", action: PermissionAction.READ }
    ])
    @Get('phone-numbers/:wabaId')
    getPhoneNumbers(
        @Param('account') accountId: string,
        @Param('wabaId') wabaId: string,
    ) {
        return this.whatsAppTemplateService.getPhoneNumbers(accountId, wabaId)
    }

    @PermissionsDecorator([
        { entity: "media_file", action: PermissionAction.READ }
    ])
    @Post('media')
    getMediaId(
        @Param('account') accountId: string,
        @Body() dto: GetMediaIdDto
    ) {
        return this.whatsAppTemplateService.getMediaId(accountId, dto)
    }

    @PermissionsDecorator([
        { entity: "media_file", action: PermissionAction.READ }
    ])
    @Post('media-handle')
    getMediaHandle(
        @Param('account') accountId: string,
        @Body() dto: GetMediaHandleDto
    ) {
        return this.whatsAppTemplateService.getMetaMediaHandle(accountId, dto)
    }
}