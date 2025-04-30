import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client, S3ClientConfig } from "@aws-sdk/client-s3"
import { LoggingService } from '@lib/logging';
import { ConfigService } from '@nestjs/config';
import { generateS3Key, getFileCategory, IMAGE_MIMETYPES, WHATSAPP_MIMETYPES } from '@lib/thuso-common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, EntityNotFoundError, ILike, Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto, ProductMediaDto } from '../dto/create-product.dto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EditProductDto } from '../dto/edit-product.dto';
import { ProductMedia } from '../entities/product-media.entity';

@Injectable()
export class ProductsService {
    private logger: Logger
    private s3Client: S3Client
    private s3BucketName: string
    private mimeTypes = WHATSAPP_MIMETYPES

    constructor(
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(ProductMedia)
        private readonly prodMediaRepo: Repository<ProductMedia>
    ) {
        this.logger = this.loggingService.getLogger({
            module: "products",
            file: "products.controller"
        })

        this.logger.info("Products Service initialized")

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

    async createProduct(accountId: string, data: CreateProductDto): Promise<{ product: Product, urls: string[] }> {
        if (data.media && data.media.length > 1) {
            for (const media of data.media) {
                if (!this.mimeTypes.includes(media.mimetype)) {
                    this.logger.warn("File type not allowed", { accountId, mimetype: media.mimetype })
                    throw new HttpException(`File type not allowed. Allowed types are ${this.mimeTypes}`, HttpStatus.NOT_ACCEPTABLE)
                }
            }
        }

        try {
            const types = data.media.map(media => getFileCategory(media.mimetype))
            const s3keys = data.media.map((media, i) => generateS3Key(types[i], accountId, media.filename))

            let i = 0

            for (const media of data.media) {
                data.media[i] = await this.prodMediaRepo.save(
                    this.prodMediaRepo.create({
                        accountId,
                        ...media,
                        s3key: s3keys[i]
                    })
                )

                i++
            }

            const product = await this.productRepository.save(
                this.productRepository.create({
                    accountId,
                    ...data
                })
            )

            const urls: string[] = []
            for (const media of product.media) {
                urls.push(await this.getS3UploadUrl(media.s3key, media.mimetype))
            }

            return { product, urls }
        } catch (error) {
            this.logger.error("Error while uploading file", { accountId, error })
            throw new HttpException(`Error while uploading file`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getProduct(accountId: string, id: string) {
        try {
            return await this.productRepository.findOneOrFail({ where: { accountId, id }, relations: { media: true } })
        } catch (error) {
            // Check if the error is due to the entity not being found
            if (error instanceof EntityNotFoundError) {
                this.logger.debug("Product not found", { accountId, error });
                throw new HttpException("Product not found", HttpStatus.NOT_FOUND);
            }

            this.logger.error("Error while getting document", { accountId, error })
            throw new HttpException(`Error while getting document`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async editProduct(accountId: string, id: string, data: EditProductDto): Promise<{ product: Product, urls: string[] }> {
        try {
            const prod = await this.productRepository.findOne({ where: { accountId, id } })
            if (!prod) throw new Error("No such document")

            const keys = Object.keys(data)

            for (const key of keys) {
                if (key === "media") continue
                prod[key] = data[key]
            }

            const urls: string[] = []

            if (data.media && data.media.length > 0) {
                const types = data.media.map(media => getFileCategory(media.mimetype))
                const s3keys = data.media.map((media, i) => generateS3Key(types[i], accountId, media.filename))

                let i = 0
                const savedMedia: ProductMedia[] = []

                for (const media of data.media) {
                    savedMedia[i] = await this.prodMediaRepo.save(
                        this.prodMediaRepo.create({
                            accountId,
                            ...media,
                            s3key: s3keys[i]
                        })
                    )

                    if (prod.media) {
                       prod.media.push(savedMedia[i]) 
                    } else {
                        prod.media = [savedMedia[i]]
                    }
                    

                    i++
                }

                for (const media of savedMedia) {
                    urls.push(await this.getS3UploadUrl(media.s3key, media.mimetype))
                }
            }

            const product = await this.productRepository.save(prod)

            return { product, urls }
        } catch (error) {
            this.logger.error("Error while uploading file", { accountId, error })
            throw new HttpException(`Error while uploading file`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async listProducts(accountId: string, skip?: number | undefined, take?: number | undefined, search?: string) {
        try {
            let where: any

            if (search) {
                where = [{ accountId, name: ILike(`%${search}%`) }, { accountId, shortDescription: ILike(`%${search}%`) }]
            } else {
                where = { accountId }
            }

            return await this.productRepository.findAndCount({ where, skip, take })
        } catch (error) {
            this.logger.error("Error while uploading file", { accountId, error })
            throw new HttpException(`Error while uploading file`, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getMediaLink(accountId: string, productId: string, mediaId: string): Promise<string> {
        try {
            const media = await this.prodMediaRepo.findOneOrFail({ where: { id: mediaId, accountId, product: { id: productId } } })
            return await getSignedUrl(
                this.s3Client,
                new GetObjectCommand({
                    Bucket: this.s3BucketName,
                    Key: media.s3key
                }),
                { expiresIn: 900 }
            )
        } catch (error) {
            if (error instanceof EntityNotFoundError) {
                this.logger.debug("Product not found", { accountId, error });
                throw new HttpException("Product not found", HttpStatus.NOT_FOUND);
            }
            this.logger.error("Error while getting media link", { error, accountId, productId })
            throw new HttpException("Error getting media link", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async deleteProductMedia(accountId: string, productId: string, mediaId: string): Promise<DeleteResult> {
        try {
            const media = await this.prodMediaRepo.findOneOrFail({ where: { id: mediaId, accountId, product: { id: productId } } })
            await this.deleteS3Object(media.s3key)
            return await this.prodMediaRepo.delete(media)
        } catch (error) {
            if (error instanceof EntityNotFoundError) {
                this.logger.debug("Product not found", { accountId, error });
                throw new HttpException("Product not found", HttpStatus.NOT_FOUND);
            }
            this.logger.error("Error while deleting media", { error, accountId, productId })
            throw new HttpException("Error while deleting media", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async deleteProduct(accountId: string, id: string): Promise<DeleteResult> {
        try {
            const prod = await this.productRepository.findOne({ where: { accountId, id }, relations: { media: true } })
            if (!prod) throw new Error("No such document")

            for (const media of prod.media) {
                await this.deleteS3Object(media.s3key)
                await this.prodMediaRepo.delete(media)
            }

            return await this.productRepository.delete({ accountId, id })

        } catch (error) {
            this.logger.error("Failed to delete document", error)
            throw new Error(error.detail ? error.detail : "Document delete failed")
        }
    }

    async getS3UploadUrl(key: string, mimetype: string): Promise<string> {
        try {
            return await getSignedUrl(this.s3Client, new PutObjectCommand({
                Bucket: this.s3BucketName,
                Key: key,
                ContentType: mimetype
            }), { expiresIn: 900 })
        } catch (error) {
            this.logger.error("Failed to upload file to S3", error)
            throw new Error(error.detail ? error.detail : "S3 file upload failed")
        }
    }

    async deleteS3Object(key: string): Promise<void> {
        try {
            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.s3BucketName,
                    Key: key
                })
            )
        } catch (error) {
            this.logger.error("Failed to delete S3 object", error)
            throw new Error(error.detail ? error.detail : "S3 object delete failed")
        }
    }
}
