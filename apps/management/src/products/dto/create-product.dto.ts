import { IsString, IsUUID } from "class-validator"

export class CreateProductDto {
    @IsUUID()
    businessProfile: string

    @IsString()
    name: string

    @IsString()
    description: string
}