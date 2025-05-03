import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { LoggingService } from '@lib/logging';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { S3Client, S3ClientConfig, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProductsApiService {
    private logger: Logger
    private s3Client: S3Client
    private s3BucketName: string

    constructor(
        private readonly loggingService: LoggingService,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "products",
            file: "products.api.service"
        })

        const s3Config: S3ClientConfig = {
            credentials: {
                accessKeyId: this.configService.get<string>("S3_ACCESS_KEY_ID"), // 'your-access-key-id'
                secretAccessKey: this.configService.get<string>("S3_SECRET_ACCESS_KEY"), // 'your-secret-access-key'
            },
            region: this.configService.get<string>("S3_REGION"), // 'region',
        }

        this.s3Client = new S3Client(s3Config);
        this.s3BucketName = this.configService.get<string>("S3_BUCKET_NAME")
    }

    async getProduct(businessProfileId: string, id: string) {
        try {
            return await this.productRepository.findOneOrFail({ where: { businessProfileId, id }, relations: { media: true } })
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

    async getProductForView(businessProfileId: string, id: string) {
        try {
            const product = await this.productRepository.findOneOrFail({ where: { businessProfileId, id }, relations: { media: true } })
            product.views = product.views + 1
            return await this.productRepository.save(product)
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

    async getMediaLink(s3key: string): Promise<string> {
        try {
            return await getSignedUrl(
                this.s3Client,
                new GetObjectCommand({
                    Bucket: this.s3BucketName,
                    Key: s3key
                }),
                { expiresIn: 900 }
            )
        } catch (error) {
            if (error instanceof EntityNotFoundError) {
                this.logger.debug("Product not found", { error });
                throw new HttpException("Product not found", HttpStatus.NOT_FOUND);
            }
            this.logger.error("Error while getting media link", { error })
            throw new HttpException("Error getting media link", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}
