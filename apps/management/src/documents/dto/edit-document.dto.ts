import { PartialType } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { CreateDocumentDto } from "./create-document.dto";

export class EditDocumentDto extends PartialType(CreateDocumentDto) {
    @IsOptional()
    @IsUUID()
    businessProfileId?: string

    @IsOptional()
    @IsString()
    name?: string
    
    @IsOptional()
    @IsString()
    description?: string

    @IsOptional()
    @IsString()
    filename?: string;
    
    @IsOptional()
    @IsString()
    mimetype?: string;
}