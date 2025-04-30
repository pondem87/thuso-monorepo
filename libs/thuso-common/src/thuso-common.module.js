"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThusoCommonModule = void 0;
const common_1 = require("@nestjs/common");
const thuso_common_service_1 = require("./thuso-common.service");
const api_auth_guard_1 = require("./api-auth-guard");
const logging_1 = require("../../logging/src");
const graph_api_service_1 = require("./graph-api.service");
let ThusoCommonModule = class ThusoCommonModule {
};
exports.ThusoCommonModule = ThusoCommonModule;
exports.ThusoCommonModule = ThusoCommonModule = __decorate([
    (0, common_1.Module)({
        imports: [logging_1.LoggingModule],
        providers: [thuso_common_service_1.ThusoCommonService, api_auth_guard_1.ApiAuthGuard, graph_api_service_1.GraphAPIService],
        exports: [thuso_common_service_1.ThusoCommonService, api_auth_guard_1.ApiAuthGuard, graph_api_service_1.GraphAPIService],
    })
], ThusoCommonModule);
//# sourceMappingURL=thuso-common.module.js.map