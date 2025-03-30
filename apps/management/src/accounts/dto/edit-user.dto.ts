import { IsOptional, IsString, MinLength } from "class-validator"

export class EditUserDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    forenames: string

    @IsOptional()
    @IsString()
    @MinLength(3)
    surname: string
}