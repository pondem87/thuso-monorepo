import { IsString, IsUUID } from "class-validator"

export class CreateDocumentDto {
    @IsUUID()
    businessProfileId: string

    @IsString()
    name: string
    
    @IsString()
    description: string

    @IsString()
    filename: string;
    
    @IsString()
    mimetype: string;
}