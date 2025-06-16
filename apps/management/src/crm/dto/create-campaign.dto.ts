import { Biller, Component } from "@lib/thuso-common"
import { IsArray, IsBoolean, IsEnum, IsInt, IsString, IsUUID } from "class-validator"


export class CreateCampaignDto {
    @IsUUID()
    templateId: string

    @IsString()
    templateName: string

    @IsString()
    name: string

    @IsString()
    wabaId: string

    @IsString()
    phoneNumberId: string

    @IsArray()
    components: Component[]

    @IsInt()
    totalMessageLimit: number

    @IsBoolean()
    unfilteredClients: boolean

    biller: Biller
}