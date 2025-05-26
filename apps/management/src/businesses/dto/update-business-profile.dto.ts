import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateBusinessProfileDto {
    @IsOptional()
    @IsString()
    botname?: string;

    @IsOptional()
    @IsString()
    greeting: string;

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

    @IsOptional()
    @IsUUID()
    businessId?: string
}