import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../../accounts/permissions-guard';
import { AuthGuard } from '../../auth/auth-guard';
import { MediaService } from '../services/media.service';
import { LoggingService } from '@lib/logging';
import { Logger } from 'winston';
import { PermissionsDecorator } from '../../accounts/permissions.decorator';
import { PermissionAction } from '../../accounts/types';
import { CreateMediaDto } from '../dto/create-media.dto';
import { EditMediaDto } from '../dto/edit-media.dto';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller("management/:account/media")
export class MediaController {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly mediaService: MediaService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "media",
            file: "media.service"
        })

        this.logger.info("Initialised Media service")
    }

    @PermissionsDecorator([
        { entity: "media_file", action: PermissionAction.CREATE }
    ])
    @Post()
    createMedia(
        @Param('account') accountId: string,
        @Body() dto: CreateMediaDto
    ) {
        return this.mediaService.createMedia(accountId, dto)
    }

    @PermissionsDecorator([
        { entity: "media_file", action: PermissionAction.READ }
    ])
    @Get()
    listMedia(
        @Param('account') accountId: string,
        @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
        @Query('take', new ParseIntPipe({ optional: true })) take?: number,
        @Query('search') search?: string
    ) {
        return this.mediaService.listMedia(accountId, skip, take, search)
    }

    @PermissionsDecorator([{
        entity: "media_file", action: PermissionAction.READ
    }])
    @Get(':mediaId')
    getMedia(
        @Param('account') accountId: string,
        @Param('mediaId') mediaId: string
    ) {
        return this.mediaService.getMedia(accountId, mediaId)
    }

    @PermissionsDecorator([
        { entity: "media_file", action: PermissionAction.UPDATE }
    ])
    @Patch(':mediaId')
    updateMedia(
        @Param('account') accountId: string,
        @Param('mediaId') mediaId: string,
        @Body() dto: EditMediaDto
    ) {
        return this.mediaService.editMedia(accountId, mediaId, dto)
    }

    @PermissionsDecorator([
        { entity: "media_file", action: PermissionAction.UPDATE }
    ])
    @Delete(':mediaId')
    deleteMedia(
        @Param('account') accountId: string,
        @Param('mediaId') mediaId: string
    ) {
        return this.mediaService.deleMedia(accountId, mediaId)
    }

    @PermissionsDecorator([
        { entity: "media_file", action: PermissionAction.READ }
    ])
    @Get(':mediaId/link')
    getMediaLink(
        @Param('account') accountId: string,
        @Param('mediaId') mediaId: string,
    ) {
        return this.mediaService.getMediaLink(accountId, mediaId)
    }
}
