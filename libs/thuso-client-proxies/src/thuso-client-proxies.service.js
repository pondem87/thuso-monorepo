"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThusoClientProxiesService = void 0;
const logging_1 = require("../../logging/src");
const thuso_common_1 = require("../../thuso-common/src");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
let ThusoClientProxiesService = class ThusoClientProxiesService {
    constructor(loggingService, mngntRmqClient, whatsappRmqClient, llmRmqClient) {
        this.loggingService = loggingService;
        this.mngntRmqClient = mngntRmqClient;
        this.whatsappRmqClient = whatsappRmqClient;
        this.llmRmqClient = llmRmqClient;
        this.logger = this.loggingService.getLogger({
            module: "thuso-client-proxies",
            file: "thuso-client-proxies.service"
        });
        this.logger.info("Initialise Thuso Client Proxies Service");
    }
    emitMgntQueue(pattern, data) {
        return this.mngntRmqClient.emit(pattern, data);
    }
    emitWhatsappQueue(pattern, data) {
        return this.whatsappRmqClient.emit(pattern, data);
    }
    emitLlmQueue(pattern, data) {
        return this.llmRmqClient.emit(pattern, data);
    }
};
exports.ThusoClientProxiesService = ThusoClientProxiesService;
exports.ThusoClientProxiesService = ThusoClientProxiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(thuso_common_1.MgntRmqClient)),
    __param(2, (0, common_1.Inject)(thuso_common_1.WhatsappRmqClient)),
    __param(3, (0, common_1.Inject)(thuso_common_1.LlmRmqClient)),
    __metadata("design:paramtypes", [logging_1.LoggingService,
        microservices_1.ClientProxy,
        microservices_1.ClientProxy,
        microservices_1.ClientProxy])
], ThusoClientProxiesService);
//# sourceMappingURL=thuso-client-proxies.service.js.map