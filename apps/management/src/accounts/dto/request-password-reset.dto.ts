import { IsString } from "class-validator";

export class RequestPasswordResetDto {
    @IsString()
    email: string
}