import { IsString } from "class-validator"

export class GetMediaIdDto {
    @IsString()
    wabaId: string
    
    @IsString()
    phoneNumberId: string
    
    @IsString()
    mediatype: string
    
    @IsString()
    mediaS3key: string
}
