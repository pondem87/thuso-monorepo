import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Matches } from "class-validator"
import { CreateCustomerDto } from "./create-customer.dto"
import { PartialType } from "@nestjs/swagger"
import { Gender } from "../types"

export class EditCustomerDto extends PartialType(CreateCustomerDto) {
	@IsOptional()
	@IsString()
	forenames?: string

	@IsOptional()
	@IsString()
	surname?: string

	@IsOptional()
	@IsString()
	address?: string

	@IsOptional()
	@IsString()
    city: string

	@IsOptional()
    @IsString()
    country: string

	@IsOptional()
	@IsString()
	@IsEmail()
	email?: string

	@IsOptional()
	@IsNumber()
	age?: number

	@IsOptional()
	@IsEnum(Gender)
	gender?: Gender

	@IsOptional()
	@IsString()
	@Matches(/^(?:\+|00)[1-9][0-9]{6,14}$/, {
		message: 'WhatsApp number must start with + or 00 followed by 7 to 15 digits.',
	})
	whatsAppNumber?: string
}
