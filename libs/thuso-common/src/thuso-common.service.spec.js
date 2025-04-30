"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const thuso_common_service_1 = require("./thuso-common.service");
describe('ThusoCommonService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [thuso_common_service_1.ThusoCommonService],
        }).compile();
        service = module.get(thuso_common_service_1.ThusoCommonService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=thuso-common.service.spec.js.map