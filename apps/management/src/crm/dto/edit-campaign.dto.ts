import { IsInt } from "class-validator"

export class EditCampaignDto {
    @IsInt()
    totalMessageLimit: number
}