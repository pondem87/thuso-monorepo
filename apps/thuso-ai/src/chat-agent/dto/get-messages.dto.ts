import { IsString, IsUUID } from "class-validator";

export class GetMessagesDto {
    @IsString()
    @IsUUID()
    chatHistoryId: string
}