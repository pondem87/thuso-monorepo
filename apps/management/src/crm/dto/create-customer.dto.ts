import { IsBoolean, IsEmail, IsEnum, IsNumber, IsNumberString, IsOptional, IsString, Matches } from "class-validator"
import { Gender } from "../types"
import { Transform, Type } from "class-transformer"

export class CreateCustomerDto {
    @IsString()
    forenames: string

    @IsString()
    surname: string

    @IsOptional()
    @IsString()
    @IsEmail()
    email?: string

    @IsOptional()
    @IsString()
    streetAd?: string

    @IsString()
    city: string

    @IsString()
    country: string

    @IsOptional()
    @IsNumber()
    age?: number

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender

    @IsString()
    @Matches(/^(?:\+|00)[1-9][0-9]{6,14}$/, {
        message: 'WhatsApp number must start with + or 00 followed by 7 to 15 digits.',
    })
    whatsAppNumber: string
}