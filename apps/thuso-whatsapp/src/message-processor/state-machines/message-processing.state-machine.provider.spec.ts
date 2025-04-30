import { Test, TestingModule } from "@nestjs/testing";
import { MessageProcessingStateMachineProvider } from "./message-processing.state-machine.provider";
import { BusinessInfo, InteractiveStateMachineProvider } from "./interactive.state-machine.provider";
import { InteractiveStateMachineService } from "./interactive.state-machine.service";
import { LoggingService, mockedLoggingService } from "@lib/logging";
import { HomeStateService } from "../machine-states/home-state.service";
import { ProductsStateService } from "../machine-states/products-state.service";
import { LLMQueueService } from "../services/llm-queue.service";
import { Contact, GraphAPIService, Messages, Metadata, WhatsappRmqClient } from "@lib/thuso-common";
import { ConfigService } from "@nestjs/config";
import { AnyActorRef, waitFor } from "xstate";
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies";


describe('MessageProcessorService', () => {
    let provider: MessageProcessingStateMachineProvider;

    const llmQueueService = {
        sendPlainTextToLLM: jest.fn()
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InteractiveStateMachineProvider,
                {
                    provide: InteractiveStateMachineService,
                    useValue: {
                        getPersistedInteractiveState: jest.fn().mockResolvedValue(null),
                        savePersistedInteractiveState: jest.fn().mockResolvedValue(null)
                    },
                },
                {
                    provide: LoggingService,
                    useValue: mockedLoggingService,
                },
                HomeStateService,
                ProductsStateService,
                {
                    provide: LLMQueueService,
                    useValue: llmQueueService
                },
                {
                    provide: ThusoClientProxiesService,
                    useValue: {}
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((input) => input)
                    }
                },
                {
                    provide: GraphAPIService,
                    useValue: {}
                },
                MessageProcessingStateMachineProvider
            ],
        }).compile();

        provider = module.get<MessageProcessingStateMachineProvider>(MessageProcessingStateMachineProvider);
    });

    it('should start machine', async () => {
        const wabaId = "waba_54321"

        const metadata: Metadata = {
            display_phone_number: "display_phone_number",
            phone_number_id: "PHONE_NUMBER_ID"
        };

        const contact: Contact = {
            "profile": {
                "name": "NAME"
            },
            "wa_id": "WHATSAPP_ID"
        }

        const message: Messages = {
            "from": "<WHATSAPP_USER_PHONE_NUMBER>",
            "id": "<WHATSAPP_MESSAGE_ID>",
            "timestamp": "<WEBHOOK_SENT_TIMESTAMP>",
            "text": {
                "body": "<MESSAGE_BODY_TEXT>"
            },
            "type": "text"
        }

        const businessInfo: BusinessInfo = {
            name: "business_name",
            tagline: "thunderbolt kick",
            wabaToken: "some-business-token"
        }

        const mpsActor = provider.getMachineActor({
            wabaId,
            metadata,
            message,
            businessInfo,
            contact
        })

        console.log(mpsActor.getSnapshot().context)

        mpsActor.start()

        console.log(mpsActor.getSnapshot().value)

        await waitFor(
            mpsActor as AnyActorRef,
            (state) => state.matches("ProcessSuccess") || state.matches("ProcessFailure")
        )

        console.log(mpsActor.getSnapshot().value)
    })
})