import { IsString } from "class-validator";

export class GetMediaHandleDto {
    @IsString()
    wabaId: string

    @IsString()
    fileSize: string

    @IsString()
    mimetype: string

    @IsString()
    s3key: string
}