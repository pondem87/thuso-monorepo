import { IsEmail, IsString, MinLength } from "class-validator"

export class CreateAccountAndRootUserDto {
    @IsString()
    @IsEmail()
    email: string

    @IsString()
    @MinLength(3)
    forenames: string

    @IsString()
    @MinLength(3)
    surname: string

    @IsString()
    @MinLength(8)
    password: string

    @IsString()
    @MinLength(8)
    repeatPassword: string

    @IsString()
    @MinLength(3)
    accountName: string
}