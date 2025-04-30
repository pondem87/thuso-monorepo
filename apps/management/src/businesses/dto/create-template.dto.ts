import { WhatsAppTemplateType } from "@lib/thuso-common"
import { IsJSON, IsString } from "class-validator"

export class CreateWhatsAppTemplateDto {
    @IsString()
    wabaId: string
    
    template: WhatsAppTemplateType
}