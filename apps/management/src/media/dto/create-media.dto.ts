import { IsString, IsNumber } from 'class-validator';

export class CreateMediaDto {
    @IsString()
    name: string
    
    @IsString()
    filename: string;

    @IsString()
    mimetype: string;

    @IsNumber()
    fileSize: number;

    @IsString()
    description: string;

    @IsString()
    wabaId: string
}
