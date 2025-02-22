import { IsString } from "class-validator"

export class CreateBusinessDto {
    @IsString()
    wabaId: string

    @IsString()
    phoneNumberId: string

    @IsString()
    exchangeToken: string
}