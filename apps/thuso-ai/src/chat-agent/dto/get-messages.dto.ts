import { IsNumber, IsString } from "class-validator";

export class GetMessagesDto {
    @IsString()
    userId: string

    @IsString()
    phoneNumberId: string
}