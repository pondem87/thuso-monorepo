import { LoggingService } from '@lib/logging';
import { MessengerRMQMessage } from '@lib/thuso-common';
import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { MessengerProcessStateMachineProvider } from '../state-machines/messenger-process.state-machine.provider';
import { AnyActorRef, waitFor } from 'xstate';

@Injectable()
export class MessengerService {
    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService,
        private readonly messengerProcessStateMachineProvider: MessengerProcessStateMachineProvider
    ) {
        this.logger = this.loggingService.getLogger({
            module: "messenger",
            file: "messenger.service"
        })

        this.logger.info("Initialised MessengerService")
    }

    async processMessage(payload: MessengerRMQMessage) {
        const mpsmActor = this.messengerProcessStateMachineProvider.getMachineActor({ payload })
        mpsmActor.start()
        await waitFor(
            mpsmActor as AnyActorRef,
            (snapshot) => snapshot.hasTag('final')
        )
        
        if (mpsmActor.getSnapshot().hasTag('failure')) {
            this.logger.error("Error processing message", { context: mpsmActor.getSnapshot().context })                                
        }
    }
}
