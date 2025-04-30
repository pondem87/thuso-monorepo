"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const logging_service_1 = require("./logging.service");
const config_1 = require("@nestjs/config");
describe('LoggingService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                logging_service_1.LoggingService,
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((input) => input)
                    }
                }
            ],
        }).compile();
        service = module.get(logging_service_1.LoggingService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=logging.service.spec.js.map