import { Body, Controller, Get, HttpCode, ParseIntPipe, Post, Query } from '@nestjs/common';
import { Logger } from 'winston';
import { WhatsappService } from './whatsapp.service';
import { LoggingService } from '@lib/logging';
import { WhatsAppWebhookPayloadDto } from '@lib/thuso-common';

@Controller('whatsapp/webhook')
export class WhatsappController {
    private logger: Logger
    
    constructor (
        private readonly whatsappService: WhatsappService,
        private readonly loggingService: LoggingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "whatsapp",
            file: "whatsapp.controller"
        })
    
        this.logger.info("Whatsapp controller initialized.")
    }
    
    // whatsapp webhook and verification
    // webhook
    @HttpCode(200)
    @Post()
    receiveWhatsappHook(
        @Body() payload: WhatsAppWebhookPayloadDto
    ) {
        this.logger.debug(
            "Received webhook notification payload",
            { context: { payload } }
        )
        return this.whatsappService.processWhatsappHookPayload(payload)
    }

    // verification
    @Get()
    verifyWhatsappHook(
        @Query("hub.mode") hubMode: string,
        @Query("hub.verify_token") hubVerifyToken: string,
        @Query("hub.challenge", ParseIntPipe) hubChallenge: number
        
    ) {
        this.logger.info("Received whatsapp webhook verification request.")

        return this.whatsappService.verifyWhatsAppWebhook(hubMode, hubVerifyToken, hubChallenge)
    }
}
