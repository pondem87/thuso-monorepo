import { PartialType } from "@nestjs/swagger";
import { CreateMediaDto } from "./create-media.dto";
import { IsString, IsOptional, IsNumber } from "class-validator";

export class EditMediaDto extends PartialType(CreateMediaDto) {
    @IsOptional()
    @IsString()
    name: string

    @IsOptional()
    @IsString()
    filename?: string;

    @IsOptional()
    @IsString()
    mimetype?: string;

    @IsOptional()
    @IsNumber()
    fileSize?: number;

    @IsOptional()
    @IsString()
    description?: string;
}