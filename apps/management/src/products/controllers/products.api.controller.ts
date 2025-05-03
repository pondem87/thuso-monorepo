import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { Logger } from 'winston';
import { LoggingService } from '@lib/logging';
import { ApiAuthGuard } from '@lib/thuso-common';
import { ProductsApiService } from '../services/products.api.service';

@UseGuards(ApiAuthGuard)
@Controller('api/:profileId/products')
export class ProductsApiController {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly productsApiService: ProductsApiService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "products",
            file: "products.api.controller"
        })

        this.logger.info("Products API Controller initialized")
    }

    
    @Get()
    listProducts(
        @Param('profileId') profileId: string,
        @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
        @Query('take', new ParseIntPipe({ optional: true })) take?: number
    ) {
        return this.productsApiService.listProducts(profileId, skip, take)
    }

    @Get(":productId")
    getProduct(
        @Param('profileId') profileId: string,
        @Param('productId') id: string,
    ) {
        return this.productsApiService.getProductForView(profileId, id)
    }

    @Post("media-link")
    getMediaLink(
        @Body() { s3key }: { s3key: string }
    ) {
        return this.productsApiService.getMediaLink(s3key)
    }
}