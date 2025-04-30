import { Type } from "class-transformer"
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator"
import { ProductMediaDto } from "./create-product.dto"

export class EditProductDto {
    @IsOptional()
    @IsString()
    businessProfileId: string

    @IsOptional()
    @IsString()
    name: string

    @IsOptional()
    @IsString()
    shortDescription: string

    @IsOptional()
    @IsString()
    fullDetails: string

    @IsOptional()
    @IsString()
    price?: string

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductMediaDto)
    media?: ProductMediaDto[];
}