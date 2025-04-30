"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThusoClientProxiesModule = void 0;
const common_1 = require("@nestjs/common");
const thuso_client_proxies_service_1 = require("./thuso-client-proxies.service");
const thuso_common_1 = require("../../thuso-common/src");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const logging_1 = require("../../logging/src");
let ThusoClientProxiesModule = class ThusoClientProxiesModule {
};
exports.ThusoClientProxiesModule = ThusoClientProxiesModule;
exports.ThusoClientProxiesModule = ThusoClientProxiesModule = __decorate([
    (0, common_1.Module)({
        imports: [logging_1.LoggingModule],
        providers: [
            thuso_client_proxies_service_1.ThusoClientProxiesService,
            {
                provide: thuso_common_1.MgntRmqClient,
                useFactory: (configService) => {
                    return microservices_1.ClientProxyFactory.create({
                        transport: microservices_1.Transport.RMQ,
                        options: {
                            urls: [`${configService.get("THUSO_RMQ_URL")}:${configService.get("THUSO_RMQ_PORT")}`],
                            queue: configService.get("MANAGEMENT_RMQ_QUEUENAME"),
                            queueOptions: {
                                durable: configService.get("THUSO_RMQ_IS_DURABLE") === "true" ? true : false
                            },
                        },
                    });
                },
                inject: [config_1.ConfigService],
            },
            {
                provide: thuso_common_1.WhatsappRmqClient,
                useFactory: (configService) => {
                    return microservices_1.ClientProxyFactory.create({
                        transport: microservices_1.Transport.RMQ,
                        options: {
                            urls: [`${configService.get("THUSO_RMQ_URL")}:${configService.get("THUSO_RMQ_PORT")}`],
                            queue: configService.get("WHATSAPP_RMQ_QUEUENAME"),
                            queueOptions: {
                                durable: configService.get("THUSO_RMQ_IS_DURABLE") === "true" ? true : false
                            },
                        },
                    });
                },
                inject: [config_1.ConfigService]
            },
            {
                provide: thuso_common_1.LlmRmqClient,
                useFactory: (configService) => {
                    return microservices_1.ClientProxyFactory.create({
                        transport: microservices_1.Transport.RMQ,
                        options: {
                            urls: [`${configService.get("THUSO_RMQ_URL")}:${configService.get("THUSO_RMQ_PORT")}`],
                            queue: configService.get("AI_RMQ_QUEUENAME"),
                            queueOptions: {
                                durable: configService.get("THUSO_RMQ_IS_DURABLE") === "true" ? true : false
                            },
                        },
                    });
                },
                inject: [config_1.ConfigService],
            }
        ],
        exports: [thuso_client_proxies_service_1.ThusoClientProxiesService, thuso_common_1.MgntRmqClient, thuso_common_1.WhatsappRmqClient, thuso_common_1.LlmRmqClient],
    })
], ThusoClientProxiesModule);
//# sourceMappingURL=thuso-client-proxies.module.js.map