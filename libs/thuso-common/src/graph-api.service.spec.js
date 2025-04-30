"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const graph_api_service_1 = require("./graph-api.service");
const config_1 = require("@nestjs/config");
const logging_1 = require("../../logging/src");
jest.mock("axios");
const formAppend = jest.fn();
jest.mock("form-data", () => {
    return {
        default: jest.fn().mockImplementation(() => {
            return {
                append: formAppend,
                getHeaders: jest.fn()
            };
        })
    };
});
global.fetch = jest.fn();
describe('GraphAPIService', () => {
    let service;
    const mockConfigService = {
        get: jest.fn().mockImplementation((key) => {
            switch (key) {
                case "FACEBOOK_GRAPH_API":
                    return "FACEBOOK_GRAPH_API";
                default:
                    return "";
            }
        })
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                graph_api_service_1.GraphAPIService,
                {
                    provide: logging_1.LoggingService,
                    useValue: logging_1.mockedLoggingService
                },
                {
                    provide: config_1.ConfigService,
                    useValue: mockConfigService
                }
            ],
        }).compile();
        service = module.get(graph_api_service_1.GraphAPIService);
    });
    afterEach(() => {
        jest.spyOn(global, 'fetch').mockClear();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('call fetch endpoint', async () => {
        const phoneNumberId = "WHATSAPP_NUMBER_ID";
        const businessToken = "WHATSAPP_BUSINESS_TOKEN";
        const messageBody = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: "267778778678",
            type: "text",
            text: {
                body: "this is the body",
                preview_url: true
            }
        };
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
        });
        const res = await service.messages(businessToken, phoneNumberId, messageBody);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith(`FACEBOOK_GRAPH_API/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${businessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageBody)
        });
    });
});
//# sourceMappingURL=graph-api.service.spec.js.map