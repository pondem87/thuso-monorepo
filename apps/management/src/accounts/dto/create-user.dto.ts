import { IsString, MinLength } from "class-validator"

export class CreateUserDto {
    @IsString()
    email: string

    @IsString()
    names: string

    @IsString()
    surname: string

    @IsString()
    @MinLength(8)
    password: string

    @IsString()
    @MinLength(8)
    repeatPassword: string
}