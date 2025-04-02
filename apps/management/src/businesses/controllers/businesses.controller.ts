import { Controller, UseGuards, Post, Body, Request, Param, Get, Delete, Patch } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth-guard';
import { PermissionsGuard } from '../../accounts/permissions-guard';
import { LoggingService } from '@lib/logging';
import { Logger } from 'winston';
import { PermissionsDecorator } from '../../accounts/permissions.decorator';
import { PermissionAction } from '../../accounts/types';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { CreateBusinessProfileDto } from '../dto/create-business-profile.dto';
import { UpdateBusinessProfileDto } from '../dto/update-business-profile.dto';
import { BusinessesService } from '../services/businesses.service';
import { User } from '../../accounts/entities/user.entity';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller("management/:account/businesses")
export class BusinessesController {
    private logger: Logger
    constructor(
        private readonly businessesService: BusinessesService,
        private readonly loggingService: LoggingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "businesses",
            file: "businesses.controller"
        })

        this.logger.info("Businesses controller created")
    }

    @PermissionsDecorator([
        { entity: "whatsapp_business", action: PermissionAction.CREATE },
        { entity: "whatsapp_number", action: PermissionAction.CREATE }
    ])
    @Post()
    createWhatsAppBusiness(
        @Body() data: CreateBusinessDto,
        @Param('account') accountId: string,
        @Request() request
    ) {
        const { user }: { user: User } = request
        return this.businessesService.createWhatsAppBusiness(user, accountId, data)
    }

    @PermissionsDecorator([
        { entity: "whatsapp_business", action: PermissionAction.READ },
        { entity: "whatsapp_number", action: PermissionAction.UPDATE }
    ])
    @Get('display-number/:numberId')
    getDisplayNumber(
        @Param('account') accountId: string,
        @Param('numberId') id: string
    ) {
        return this.businessesService.getDisplayNumber(accountId, id)
    }

    @PermissionsDecorator([
        { entity: "whatsapp_business", action: PermissionAction.UPDATE }
    ])
    @Get('business-name/:businessId')
    getBusinessName(
        @Param('account') accountId: string,
        @Param('businessId') id: string
    ) {
        return this.businessesService.getBusinessName(accountId, id)
    }

    @PermissionsDecorator([
        { entity: "whatsapp_business", action: PermissionAction.UPDATE }
    ])
    @Get('subscribe/:businessId')
    subscribeBusiness(
        @Param('account') accountId: string,
        @Param('businessId') id: string
    ) {
        return this.businessesService.subscribeBusiness(accountId, id)
    }

    @PermissionsDecorator([
        { entity: "whatsapp_number", action: PermissionAction.UPDATE }
    ])
    @Get('register/:numberId')
    registerAppNumber(
        @Param('account') accountId: string,
        @Param('numberId') id: string
    ) {
        return this.businessesService.registerAppNumber(accountId, id)
    }

    @PermissionsDecorator([
        { entity: "whatsapp_business", action: PermissionAction.READ }
    ])
    @Get('business')
    getBusinesses(
        @Param('account') accountId: string
    ) {
        return this.businessesService.getBusinesses(accountId)
    }

    @PermissionsDecorator([
        { entity: "business_profile", action: PermissionAction.READ }
    ])
    @Get('business-profile')
    getBusinessProfiles(
        @Param('account') accountId: string,
    ) {
        return this.businessesService.getBusinessProfiles(accountId)
    }
    
    @PermissionsDecorator([
        {entity: "whatsapp_business", action: PermissionAction.READ}
    ])
    @Get(':businessId')
    getBusiness(
        @Param('account') accountId: string,
        @Param('businessId') id: string
    ) {
        return this.businessesService.getBusiness(accountId, id)
    }

    @PermissionsDecorator([
        {entity: "whatsapp_business", action: PermissionAction.DELETE}
    ])
    @Delete(':businessId')
    deleteBusiness(
        @Param('account') accountId: string,
        @Param('businessId') id: string
    ) {
        return this.businessesService.deleteBusiness(accountId, id)
    }

    @PermissionsDecorator([
        {entity: "whatsapp_business", action: PermissionAction.DELETE}
    ])
    @Delete('number/:numberId')
    deleteAppNumber(
        @Param('account') accountId: string,
        @Param('numberId') id: string
    ) {
        return this.businessesService.deleteAppNumber(accountId, id)
    }

    @PermissionsDecorator([
        { entity: "business_profile", action: PermissionAction.CREATE }
    ])
    @Post(':businessId/business-profile')
    createBusinessProfile(
        @Body() data: CreateBusinessProfileDto,
        @Param('account') accountId: string,
        @Param('businessId') businessId: string
    ) {
        return this.businessesService.createBusinessProfile(accountId, businessId, data)
    }

    @PermissionsDecorator([
        { entity: "business_profile", action: PermissionAction.READ }
    ])
    @Get('business-profile/:profileId')
    getBusinessProfile(
        @Param('account') accountId: string,
        @Param('profileId')id: string
    ) {
        return this.businessesService.getBusinessProfile(accountId, id)
    }

    @PermissionsDecorator([
        { entity: "business_profile", action: PermissionAction.UPDATE }
    ])
    @Patch('business-profile/:profileId')
    updateBusinessProfile(
        @Body() data: UpdateBusinessProfileDto,
        @Param('account') accountId: string,
        @Param('profileId') id: string
    ) {
        return this.businessesService.updateBusinessProfile(accountId, id, data)
    }

    @PermissionsDecorator([
        { entity: "business_profile", action: PermissionAction.UPDATE },
        { entity: "whatsapp_business", action: PermissionAction.UPDATE }
    ])
    @Post('reassign-business-profile/:profileId')
    reassignBusinessProfile(
        @Body() data: { businessId: string },
        @Param('account') accountId: string,
        @Param('profileId') id: string
    ) {
        return this.businessesService.reassignBusinessProfile(accountId, id, data.businessId)
    }

    @PermissionsDecorator([
        { entity: "business_profile", action: PermissionAction.DELETE }
    ])
    @Delete('business-profile/:profileId')
    deleteBusinessProfile(
        @Param('account') accountId: string,
        @Param('profileId') id: string
    ) {
        return this.businessesService.deleteBusinessProfile(accountId, id)
    }

}
