import { IsOptional, IsString } from "class-validator"

export class CreateActionDto {
    @IsString()
    description: string

    @IsOptional()
    @IsString()
    context?: string
}