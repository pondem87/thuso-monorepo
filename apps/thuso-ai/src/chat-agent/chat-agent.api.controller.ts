import { LoggingService } from "@lib/logging";
import { ApiAuthGuard } from "@lib/thuso-common";
import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import { Logger } from "winston";
import { GetChatsDto } from "./dto/get-chats.dto";
import { GetMessagesDto } from "./dto/get-messages.dto";
import { ChatMessageHistoryApiService } from "./chat-message-history/chat-message-history.api.service";

@UseGuards(ApiAuthGuard)
@Controller('ai/chat-agent')
export class ChatAgentApiController {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly chatMsgHistoryApiService: ChatMessageHistoryApiService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "chat-agent",
            file: "chat-agent.api.controller"
        })

        this.logger.info("Initialised Chat agent Api controller")
    }

    @Get(':wabaId/chats')
    getChats(
        @Param() dto: GetChatsDto,
        @Query('skip', ParseIntPipe) skip: number,
        @Query('take', ParseIntPipe) take: number,
        @Query('topic') topic?: string,
    ) {
        return this.chatMsgHistoryApiService.getChats(dto, skip, take, topic)
    }

    @Get(':chatHistoryId/messages')
    getMessages(
        @Param() dto: GetMessagesDto,
        @Query('skip', ParseIntPipe) skip: number,
        @Query('take', ParseIntPipe) take: number
    ) {
        return this.chatMsgHistoryApiService.getMessages(dto, skip, take)
    }
}