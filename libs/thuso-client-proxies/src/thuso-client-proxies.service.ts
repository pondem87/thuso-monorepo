import { LoggingService } from '@lib/logging';
import { LlmRmqClient, MgntRmqClient, WhatsappRmqClient } from '@lib/thuso-common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Logger } from 'winston';

@Injectable()
export class ThusoClientProxiesService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @Inject(MgntRmqClient)
        private readonly mngntRmqClient: ClientProxy,
        @Inject(WhatsappRmqClient)
        private readonly whatsappRmqClient: ClientProxy,
        @Inject(LlmRmqClient)
        private readonly llmRmqClient: ClientProxy
    ) {
        this.logger = this.loggingService.getLogger({
            module: "thuso-client-proxies",
            file: "thuso-client-proxies.service"
        })

        this.logger.info("Initialise Thuso Client Proxies Service")
    }

    emitMgntQueue(pattern: any, data: any) {
        return this.mngntRmqClient.emit(pattern, data)
    }

    emitWhatsappQueue(pattern: any, data: any) {
        return this.whatsappRmqClient.emit(pattern, data)
    }

    emitLlmQueue(pattern: any, data: any) {
        return this.llmRmqClient.emit(pattern, data)
    }
}
