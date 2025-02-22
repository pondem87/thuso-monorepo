import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Logger } from 'winston';
import { AuthGuard } from '../../auth/auth-guard';
import { PermissionsGuard } from '../../accounts/permissions-guard';
import { PermissionsDecorator } from '../../accounts/permissions.decorator';
import { LoggingService } from '@lib/logging';
import { PermissionAction } from '../../accounts/types';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';

@UseGuards(AuthGuard, PermissionsGuard)
@Controller('management/:account/products')
export class ProductsController {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly productsService: ProductsService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "products",
            file: "products.controller"
        })

        this.logger.info("Products Controller initialized")
    }

    @PermissionsDecorator([
        { entity: "product", action: PermissionAction.CREATE }
    ])
    @UseInterceptors(FileInterceptor('file'))
    @Post()
    createProduct(
        @Param('account') accountId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() data: CreateProductDto
    ) {
        return this.productsService.createProduct(accountId, data, file)
    }

    @PermissionsDecorator([
        { entity: "product", action: PermissionAction.READ }
    ])
    @Get()
    listProducts(
        @Param('account') accountId: string,
        @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
        @Query('take', new ParseIntPipe({ optional: true })) take?: number
    ) {
        return this.productsService.listProducts(accountId, skip, take)
    }

    @PermissionsDecorator([
        { entity: "product", action: PermissionAction.READ }
    ])
    @Get(":productId")
    getProduct(
        @Param('account') accountId: string,
        @Param('productId') id: string,
    ) {
        return this.productsService.getProduct(accountId, id)
    }

    @PermissionsDecorator([
        { entity: "product", action: PermissionAction.UPDATE }
    ])
    @UseInterceptors(FileInterceptor('product'))
    @Patch(":productId")
    editProduct(
        @Param('account') accountId: string,
        @Param('productId') id: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() data: CreateProductDto
    ) {
        return this.productsService.editProduct(accountId, id, data, file)
    }

    @PermissionsDecorator([
        { entity: "product", action: PermissionAction.DELETE }
    ])
    @Delete(":productId")
    deleteProduct(
        @Param('account') accountId: string,
        @Param('productId') id: string,
    ) {
        return this.productsService.deleteProduct(accountId, id)
    }
}