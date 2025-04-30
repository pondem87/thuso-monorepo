import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Response, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Logger } from 'winston';
import { AuthGuard } from '../auth/auth-guard';
import { PermissionsGuard } from '../accounts/permissions-guard';
import { PermissionsDecorator } from '../accounts/permissions.decorator';
import { LoggingService } from '@lib/logging';
import { DocumentsService } from './documents.service';
import { PermissionAction } from '../accounts/types';
import { CreateDocumentDto } from './dto/create-document.dto';
import { EditDocumentDto } from './dto/edit-document.dto';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('management/:account/documents')
export class DocumentsController {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly documentsService: DocumentsService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "documents",
            file: "documents.controller"
        })

        this.logger.info("Documents Controller initialized")
    }

    @PermissionsDecorator([
        { entity: "document", action: PermissionAction.CREATE }
    ])
    @Post()
    createDocument(
        @Param('account') accountId: string,
        @Body() data: CreateDocumentDto
    ) {
        return this.documentsService.createDocument(accountId, data)
    }

    @PermissionsDecorator([
        { entity: "document", action: PermissionAction.READ }
    ])
    @Get()
    listDocuments(
        @Param('account') accountId: string,
        @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
        @Query('take', new ParseIntPipe({ optional: true })) take?: number
    ) {
        return this.documentsService.listDocuments(accountId, skip, take)
    }

    @PermissionsDecorator([
        { entity: "document", action: PermissionAction.READ }
    ])
    @Get(":documentId")
    getDocument(
        @Param('account') accountId: string,
        @Param('documentId') id: string,
    ) {
        return this.documentsService.getDocument(accountId, id)
    }

    @PermissionsDecorator([
        { entity: "document", action: PermissionAction.READ }
    ])
    @Get(":documentId/embed")
    embedDocument(
        @Param('account') accountId: string,
        @Param('documentId') id: string,
    ) {
        return this.documentsService.embedDocument(accountId, id)
    }

    @PermissionsDecorator([
        { entity: "document", action: PermissionAction.READ }
    ])
    @Get(":documentId/link")
    getDocumentLink(
        @Param('account') accountId: string,
        @Param('documentId') id: string,
    ) {
        return this.documentsService.getDownloadLink(accountId, id)
    }

    @PermissionsDecorator([
        { entity: "document", action: PermissionAction.UPDATE }
    ])
    @Patch(":documentId")
    editDocument(
        @Param('account') accountId: string,
        @Param('documentId') id: string,
        @Body() data: EditDocumentDto
    ) {
        return this.documentsService.editDocument(accountId, id, data)
    }

    @PermissionsDecorator([
        { entity: "document", action: PermissionAction.DELETE }
    ])
    @Delete(":documentId")
    deleteDocument(
        @Param('account') accountId: string,
        @Param('documentId') id: string,
    ) {
        return this.documentsService.deleteDocument(accountId, id)
    }
}
