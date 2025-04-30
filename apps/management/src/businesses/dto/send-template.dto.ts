import { Component } from "@lib/thuso-common"
import { IsJSON, IsOptional, IsString } from "class-validator"

export class SendTemplDto {
    @IsString()
    phoneNumber: string

    @IsString()
    phoneNumberId: string

    components: Component[]
}