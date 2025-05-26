import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../auth/auth-guard";
import { PermissionsGuard } from "../../accounts/permissions-guard";
import { Logger } from "winston";
import { LoggingService } from "@lib/logging";
import { CrmChatsService } from "../services/crm.chats.service";
import { PermissionsDecorator } from "../../accounts/permissions.decorator";
import { PermissionAction } from "../../accounts/types";

@UseGuards(AuthGuard, PermissionsGuard)
@Controller("management/:account/crm")
export class CrmChatsController {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly crmChatsService: CrmChatsService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "crm",
            file: "crm.chats.controller"
        })

        this.logger.info("Initialised Crm Chats Controller")
    }

    @PermissionsDecorator([
        { entity: "chats", action: PermissionAction.READ }
    ])
    @Get('chats/:wabaId')
    getChats(
        @Param('wabaId') wabaId: string,
        @Query('skip', ParseIntPipe) skip: number,
        @Query('take', ParseIntPipe) take: number,
        @Query('topic') topic?: string
    ) {
        return this.crmChatsService.getChats(wabaId, skip, take, topic)
    }

    @PermissionsDecorator([
        { entity: "chats", action: PermissionAction.READ }
    ])
    @Get('messages/:chatHistoryId')
    getMessages(
        @Param('chatHistoryId') chatHistoryId: string,
        @Query('skip', ParseIntPipe) skip: number,
        @Query('take', ParseIntPipe) take: number
    ) {
        return this.crmChatsService.getMessages(chatHistoryId, skip, take)
    }
}