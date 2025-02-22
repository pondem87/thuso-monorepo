import { AnyActorRef, assign, createActor, fromPromise, setup, waitFor } from "xstate";
import { InteractiveStateMachineProvider, ISMContext, ISMEventType } from "./interactive.state-machine.provider";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { InteractiveStateMachineService } from "./interactive.state-machine.service";
import { Contact, Messages, Metadata, StateMachineActor } from "@lib/thuso-common";
import { LoggingService } from "@lib/logging";
import { PersistedInteractiveState } from "../entities/persisted-interactive-state";


@Injectable()
export class MessageProcessingStateMachineProvider {
    private logger: Logger
    private MessageProcessingStateMachine = setup({
        types: {
            events: {} as MPSMEventType,
            context: {} as MPSMContext,
            input: {} as MPSMInput,
            children: {} as {
                getPersistedInteractiveState: "getPersistedInteractiveState";
                performStateAction: "performStateAction";
                persistInteractiveState: "persistInteractiveState";
            }
        },
        actors: {
            getPersistedInteractiveState: fromPromise(async ({ input }: { input: { wabaId: string, metadata: Metadata, contact: Contact } }) => {
                const persisted = await this.getPersistedInteractiveState(input)
                return { ...persisted }
            }),
            performStateAction: fromPromise(async ({ input }: { input: { context: MPSMContext } }) => {
                return await this.performStateAction(input)
            }),
            persistInteractiveState: fromPromise(async ({ input }: { input: { context: MPSMContext } }) => {
                return await this.persistInteractiveState(input)
            })
        }
    })
        .createMachine({
            /** @xstate-layout N4IgpgJg5mDOIC5QFs6wIYwLQAcBOA9gMZoCWAdlAHQDKALunWAEph16lgBu6ANgMQQC5MFQpcCAa1F42HbmADCAC0b1GYANoAGALqJQOArFJ1SwgyAAeiAKwB2e1QCcrt+7cAaEAE9EWAEZbKgCANnCIyPD7AIBfWO9UWAxsfGIySloGJlZ2Th4BMDxCPCocXkYAMwI8ZCpZPIUVNWytPUsjEzMLJGtEAPsAZhcPUecAFm8-BADBgCYqcbColfjEtEwwXEISZIpqdSYAQSJu8lhBYVFxKRkAV3JmukOwE7OdfV7O03NySxsZnNQtoqNpBqFxrYAByDWFwwZTfxOZYrSIxNYgJIpLZpXYmTIvN6-C5FEplCp0aq1eoPJ6E06-D4dYw-HqgAHAgJUcHOezOFERWyImbjUJUWzaSVS6WSwYYrGbbbpPYE1r0GqbS4iMTkCTSKgYLhKVTPVpMr4ss7-fpzezBcbjW3aGHw2HCgK8lwC1GheUbVI7DIHNV0DUwfikmrkqo1OqG40tDTmwyW37WhDOQZQxbeqJC3z9T38n2ReIJEDkAgQOCWBUB5X4qDMrpp3oAgJg7mu7uDALCwKDZEliLOP3JRW4oNZDS5eQFZusv5t-q2Lk97t9gsILDjZxUYcRexj7FKvH7afHBnCeAWltsvoIKEBbNQ7T2ObFlb98bZ3MrI-lnWOKBiqwYaOqeCbAuVrLjMAxcq44x8rm+bTPYIIuuusLjMeE4gY2VAAAr4QAYugpC8HcsjQa27KILu4z7uM8wfrmCJbkCjF-miuH1memTEQ2NB3EQeI0fe7ZzFCwRQu+gzONC3bCraYrOlh8y+mWQA */
            id: "message-processing",
            context: ({ input }) => ({
                wabaId: input.wabaId,
                contact: input.contact,
                metadata: input.metadata,
                message: input.message
            }),
            initial: "StateRetrieval",
            states: {
                StateRetrieval: {
                    invoke: {
                        id: "getPersistedInteractiveState",
                        src: "getPersistedInteractiveState",
                        input: ({ context: { wabaId, contact, metadata } }) => ({ wabaId, contact, metadata }),
                        onDone: {
                            target: "StateActions",
                            actions: assign({
                                persistedState: ({ event }) => event.output.persistedInteractiveState,
                                ismActor: ({ event }) => event.output.ismActor
                            })
                        },
                        onError: {
                            target: "ProcessFailure",
                            actions: assign({
                                error: ({ event }) => event.error
                            })
                        }
                    }
                },
                StateActions: {
                    invoke: {
                        id: "performStateAction",
                        src: "performStateAction",
                        input: ({ context }) => ({ context }),
                        onDone: {
                            target: "StateStorage"
                        },
                        onError: {
                            target: "ProcessFailure",
                            actions: assign({
                                error: ({ event }) => event.error
                            })
                        }
                    }
                },
                StateStorage: {
                    invoke: {
                        id: "persistInteractiveState",
                        src: "persistInteractiveState",
                        input: ({ context }) => ({ context }),
                        onDone: {
                            target: "ProcessSuccess"
                        },
                        onError: {
                            target: "ProcessFailure",
                            actions: assign({
                                error: ({ event }) => event.error
                            })
                        }
                    }
                },
                ProcessFailure: {
                    tags: ["final", "error"]
                },
                ProcessSuccess: {
                    tags: ["final", "success"]
                }
            }
        })

    constructor(
        private readonly loggingService: LoggingService,
        private readonly interactiveStateMachineService: InteractiveStateMachineService,
        private readonly interactiveStateMachineProvider: InteractiveStateMachineProvider
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "message-processing.state-machine.ts"
        })

        this.logger.info("Initializing MessageProcessingStateMachineProvider")
    }

    getMachineActor(input: MPSMInput): StateMachineActor<MPSMEventType, MPSMContext> {
        return createActor(this.MessageProcessingStateMachine, { input }) as StateMachineActor<MPSMEventType, MPSMContext>
    }

    async getPersistedInteractiveState({ wabaId, metadata, contact }: { wabaId: string, metadata: Metadata, contact: Contact }) {
        const persistedInteractiveState = await this.interactiveStateMachineService.getPersistedInteractiveState(metadata.phone_number_id, contact.wa_id)
        let ismActor: StateMachineActor<ISMEventType, ISMContext>

        // create ismActor
        if (persistedInteractiveState) {
            ismActor = createActor(this.interactiveStateMachineProvider.getInteractiveStateMachine(), { snapshot: persistedInteractiveState.persistedStateMachine })
        } else {
            ismActor = createActor(this.interactiveStateMachineProvider.getInteractiveStateMachine(), {
                input: {
                    wabaId,
                    contact,
                    metadata
                }
            })
        }

        ismActor.start()

        return { persistedInteractiveState, ismActor }
    }

    async performStateAction(input: { context: MPSMContext }) {
        const context = input.context

        context.ismActor.send({ type: "execute", message: context.message })

        await waitFor(
            context.ismActor as AnyActorRef,
            (snapshot) => snapshot.hasTag("executed") || snapshot.hasTag("ready")
        )

        if (context.ismActor.getSnapshot().hasTag("executed")) {
            // I could not send the event from within the machine itself ?bug
            context.ismActor.send(context.ismActor.getSnapshot().context.nextEvent)
        }
    }

    async persistInteractiveState(input: { context: MPSMContext }) {
        const context = input.context
        if (context.persistedState) {
            const persistedState = context.persistedState
            persistedState.persistedStateMachine = context.ismActor.getPersistedSnapshot()
            return this.interactiveStateMachineService.savePersistedInteractiveState(persistedState)
        } else {
            const persistedState = new PersistedInteractiveState()
            persistedState.phoneNumberId = context.metadata.phone_number_id
            persistedState.userId = context.contact.wa_id
            persistedState.persistedStateMachine = context.ismActor.getPersistedSnapshot()
            return this.interactiveStateMachineService.savePersistedInteractiveState(persistedState)
        }
    }
}

export type MPSMEventType = { type: string }

export type MPSMContext = {
    wabaId: string;
    contact: Contact;
    persistedState?: PersistedInteractiveState;
    ismActor?: StateMachineActor<ISMEventType, ISMContext>;
    metadata: Metadata
    message: Messages;
    error?: any
}

export type MPSMInput = {
    wabaId: string;
    contact: Contact;
    message: Messages;
    metadata: Metadata;
}