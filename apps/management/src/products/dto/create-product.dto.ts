import { Type } from "class-transformer"
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator"

export class CreateProductDto {
    @IsString()
    businessProfileId: string

    @IsString()
    name: string

    @IsString()
    shortDescription: string

    @IsString()
    fullDetails: string

    @IsString()
    price: string

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductMediaDto)
    media?: ProductMediaDto[];
}

export class ProductMediaDto {
    @IsString()
    filename: string;

    @IsString()
    mimetype: string;
}