import { Module } from '@nestjs/common';
import { ProductsController } from './controllers/products.controller';
import { ProductsService } from './services/products.service';
import { Product } from './entities/product.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggingModule } from '@lib/logging';
import { ConfigService } from '@nestjs/config';
import { ProductsApiController } from './controllers/products.api.controller';
import { ThusoCommonModule } from '@lib/thuso-common';
import { ProductsApiService } from './services/products.api.service';
import { ProductMedia } from './entities/product-media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductMedia, Product]), LoggingModule, ThusoCommonModule],
  controllers: [ProductsController, ProductsApiController],
  providers: [ProductsService, ProductsApiService, ConfigService],
  exports: [TypeOrmModule]
})
export class ProductsModule {}
