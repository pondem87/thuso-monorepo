import { IsString } from "class-validator";

export class GetChatsDto {
    @IsString()
    wabaId: string
}