import { IsEmail, IsString } from "class-validator";

export class PasswordResetDto {
    @IsEmail()
    email: string;

    @IsString()
    verificationCode: string

    @IsString()
    password: string

    @IsString()
    repeatPassword: string
}