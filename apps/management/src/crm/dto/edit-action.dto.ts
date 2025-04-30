import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from "class-validator"
import { CustomerActionType } from "../types"
import { Column } from "typeorm"
import { PartialType } from "@nestjs/swagger"
import { CreateActionDto } from "./create-action.dto"

export class EditActionDto extends PartialType(CreateActionDto) {
    @IsOptional()
    @IsString()
    description?: string

    @IsOptional()
    @IsString()
    context?: string
}