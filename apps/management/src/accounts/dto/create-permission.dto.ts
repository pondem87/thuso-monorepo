import { IsString } from "class-validator"

export class CreatePermissionDto {
    @IsString()
    userId: string
    
    @IsString()
    accountId: string
    
    @IsString()
    entity: string
    
    @IsString()
    action: string
}