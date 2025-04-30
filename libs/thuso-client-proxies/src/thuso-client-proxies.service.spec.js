"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const thuso_client_proxies_service_1 = require("./thuso-client-proxies.service");
describe('ThusoClientProxiesService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [thuso_client_proxies_service_1.ThusoClientProxiesService],
        }).compile();
        service = module.get(thuso_client_proxies_service_1.ThusoClientProxiesService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=thuso-client-proxies.service.spec.js.map