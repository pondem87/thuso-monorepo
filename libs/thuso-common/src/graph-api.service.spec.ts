import { Test, TestingModule } from "@nestjs/testing";
import { GraphAPIService } from "./graph-api.service";
import { ConfigService } from "@nestjs/config";
import { LoggingService, mockedLoggingService } from "@lib/logging";
import { TextMessageBody } from "@lib/thuso-common";

jest.mock("axios")

const formAppend = jest.fn()
jest.mock("form-data", () => {
    return {
        default: jest.fn().mockImplementation(() => {
            return {
                append: formAppend,
                getHeaders: jest.fn()
            }
        })
    }
})

global.fetch = jest.fn()

describe('GraphAPIService', () => {
    let service: GraphAPIService;

    const mockConfigService = {
        get: jest.fn().mockImplementation((key) => {
            switch (key) {
                case "FACEBOOK_GRAPH_API":
                    return "FACEBOOK_GRAPH_API"
                default:
                    return ""
            }
        })
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GraphAPIService,
                {
                    provide: LoggingService,
                    useValue: mockedLoggingService
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService
                }
            ],
        }).compile();

        service = module.get<GraphAPIService>(GraphAPIService);
    });

    afterEach(() => {
        jest.spyOn(global, 'fetch').mockClear()
    })

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('call fetch endpoint', async () => {
        const phoneNumberId = "WHATSAPP_NUMBER_ID"
        const businessToken = "WHATSAPP_BUSINESS_TOKEN"

        const messageBody: TextMessageBody = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: "267778778678",
            type: "text",
            text: {
                body: "this is the body",
                preview_url: true
            }
        }

        let fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                messaging_product: "whatsapp",
                contacts: [
                    {
                        input: "input",
                        wa_id: "wa_id"
                    }
                ],
                messages: [
                    {
                        id: "message-id",
                        message_status: "accepted",
                    }
                ]
            })
        } as unknown as Response)

        const res = await service.messages(businessToken, phoneNumberId, messageBody)

        expect(fetchSpy).toHaveBeenCalledTimes(1)
        expect(fetchSpy).toHaveBeenCalledWith(
            `FACEBOOK_GRAPH_API/${phoneNumberId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${businessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(messageBody)
                }
        )
    })

})