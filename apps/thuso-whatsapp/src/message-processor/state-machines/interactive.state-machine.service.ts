import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Logger } from "winston";
import { Repository } from "typeorm";
import { PersistedInteractiveState } from "../entities/persisted-interactive-state";
import { LoggingService } from "@lib/logging";

@Injectable()
export class InteractiveStateMachineService {

    private logger: Logger

    constructor (
        @InjectRepository(PersistedInteractiveState)
        private readonly interactiveSateRepository: Repository<PersistedInteractiveState>,
        private readonly loggingService: LoggingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "interactive.state-machine.service"
        })

        this.logger.info("Initializing InteractiveStateMachineService")
    }

    async getPersistedInteractiveState(phoneNumberId: string, userNumber: string): Promise<PersistedInteractiveState|null> {
        try {
            return await this.interactiveSateRepository.findOneBy({phoneNumberId, userId: userNumber})
        } catch(error) {
            this.logger.error("Failed to retrieve persisted state machine (PersistedInteractiveState)", error)
            return null
        }
    }

    async savePersistedInteractiveState(state: PersistedInteractiveState): Promise<PersistedInteractiveState|null> {
        try {
            return await this.interactiveSateRepository.save(state)
        } catch (error) {
            return null
        }
    }
}