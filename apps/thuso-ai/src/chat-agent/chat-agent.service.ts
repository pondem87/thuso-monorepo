import { LoggingService } from '@lib/logging';
import { LLMQueueMessage } from '@lib/thuso-common';
import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { LLMProcessStateMachineProvider } from './state-machines/llm-process.state-machine.provider';
import { AnyActorRef, waitFor } from 'xstate';

@Injectable()
export class ChatAgentService {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly llmProcessStateMachineProvider: LLMProcessStateMachineProvider
    ) {
        this.logger = this.loggingService.getLogger({
            module: "chat-agent",
            file: "chat-agent.service"
        })
    }

    async processMessage(payload: LLMQueueMessage) {
        const llmProcessActor = this.llmProcessStateMachineProvider.getActor({
            contact: payload.contact,
            metadata: payload.metadata,
            prompt: payload.prompt,
            wabaId: payload.wabaId
        })

        llmProcessActor.start()

        await waitFor(
            llmProcessActor as AnyActorRef,
            (snapshot) => snapshot.hasTag("final")
        )

        if (llmProcessActor.getSnapshot().hasTag("failure")) {
            this.logger.error("Failed to complete LLM call", { payload, context: llmProcessActor.getSnapshot().context })
        }
    }
}
