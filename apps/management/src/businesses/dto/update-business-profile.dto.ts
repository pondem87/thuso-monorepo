import { IsOptional, IsString } from 'class-validator';

export class UpdateBusinessProfileDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    tagline?: string;

    @IsOptional()
    @IsString()
    serviceDescription?: string;

    @IsOptional()
    @IsString()
    about?: string;
}