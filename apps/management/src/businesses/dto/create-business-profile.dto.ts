import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBusinessProfileDto {
    @IsNotEmpty()
    @IsString()
    botname: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    tagline: string;

    @IsNotEmpty()
    @IsString()
    serviceDescription: string;

    @IsNotEmpty()
    @IsString()
    about: string;
}