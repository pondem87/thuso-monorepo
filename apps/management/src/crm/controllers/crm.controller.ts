import { Body, Controller, Delete, Query, Get, Param, Post, UseGuards, Patch, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth-guard';
import { PermissionsGuard } from '../../accounts/permissions-guard';
import { Logger } from 'winston';
import { LoggingService } from '@lib/logging';
import { CrmService } from '../services/crm.service';
import { PermissionsDecorator } from '../../accounts/permissions.decorator';
import { PermissionAction } from '../../accounts/types';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { EditCustomerDto } from '../dto/edit-customer.dto';
import { CustomerQueryDto } from '../dto/customer-query.dtp';
import { CreateActionDto } from '../dto/create-action.dto';
import { EditActionDto } from '../dto/edit-action.dto';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller("management/:account/crm")
export class CrmController {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly crmService: CrmService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "crm",
            file: "crm.controller"
        })

        this.logger.info("Initialised CRM controller")
    }

    @PermissionsDecorator([
        { entity: "customer", action: PermissionAction.READ }
    ])
    @Get()
    listCustomer(
        @Param('account') accountId: string,
        @Query() query: CustomerQueryDto
    ) {
        return this.crmService.listCustomers(accountId, query)
    }


    @PermissionsDecorator([
        { entity: "customer", action: PermissionAction.CREATE }
    ])
    @Post()
    createCustomer(
        @Param('account') accountId: string,
        @Body() dto: CreateCustomerDto
    ) {
        return this.crmService.createCustomer(accountId, dto)
    }

    @PermissionsDecorator([
        { entity: "customer", action: PermissionAction.READ }
    ])
    @Get(":customer")
    getCustomer(
        @Param('account') accountId: string,
        @Param('customer') customerId: string
    ) {
        return this.crmService.getCustomer(accountId, customerId)
    }

    @PermissionsDecorator([
        { entity: "customer", action: PermissionAction.UPDATE }
    ])
    @Patch(":customer")
    updateCustomer(
        @Param('account') accountId: string,
        @Param('customer') customerId: string,
        @Body() dto: EditCustomerDto
    ) {
        return this.crmService.editCustomer(accountId, customerId, dto)
    }

    @PermissionsDecorator([
        { entity: "customer", action: PermissionAction.DELETE }
    ])
    @Delete(":customer")
    deleteCustomer(
        @Param('account') accountId: string,
        @Param('customer') customerId: string,
    ) {
        return this.crmService.deleteCustomer(accountId, customerId)
    }
    
    @PermissionsDecorator([
        { entity: "customer_action", action: PermissionAction.CREATE}
    ])
    @Post(':customer/actions')
    createAction (
        @Param('account') accountId: string,
        @Param('customer') customerId: string,
        @Body() dto: CreateActionDto
    ) {
        return this.crmService.createAction(accountId, customerId, dto)
    }

    @PermissionsDecorator([
        { entity: "customer_action", action: PermissionAction.READ }
    ])
    @Get(':customer/actions')
    listActions (
        @Param('account') accountId: string,
        @Param('customer') customerId: string,
        @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
        @Query('take', new ParseIntPipe({ optional: true })) take?: number
    ) {
        return this.crmService.listActions(accountId, customerId, skip, take)
    }

    @PermissionsDecorator([
        { entity: "customer_action", action: PermissionAction.UPDATE }
    ])
    @Patch(':customer/actions/:action')
    editActions (
        @Param('account') accountId: string,
        @Param('customer') customerId: string,
        @Param('action') actionId: string,
        @Body() dto: EditActionDto
    ) {
        return this.crmService.editAction(accountId, customerId, actionId, dto)
    }
}
