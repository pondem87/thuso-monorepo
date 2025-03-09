import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { LoggingService } from '@lib/logging';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductsApiService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>
    ) {
        this.logger = this.loggingService.getLogger({
            module: "products",
            file: "products.api.service"
        })
    }

    async getProduct(businessProfileId: string, id: string) {
        try {
            return await this.productRepository.findOneOrFail({ where: { businessProfileId, id } })
        } catch (error) {
            // Check if the error is due to the entity not being found
            if (error instanceof EntityNotFoundError) {
                this.logger.debug("Product not found", { businessProfileId, error });
                throw new HttpException("Product not found", HttpStatus.NOT_FOUND);
            }

            this.logger.error("Error while getting document", { businessProfileId, error })
            throw new HttpException(`Error while getting document`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async listProducts(businessProfileId: string, skip?: number | undefined, take?: number | undefined) {
        try {
            return await this.productRepository.findAndCount({ where: { businessProfileId }, skip, take })
        } catch (error) {
            this.logger.error("Error while uploading file", { businessProfileId, error })
            throw new HttpException(`Error while uploading file`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}
