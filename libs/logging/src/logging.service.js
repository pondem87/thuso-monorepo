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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const winston_1 = require("winston");
const { Loggly } = require('winston-loggly-bulk');
const { combine, timestamp, json, errors, prettyPrint } = winston_1.format;
let LoggingService = class LoggingService {
    constructor(config) {
        this.config = config;
        this.setLogLevel = this.config.get("LOG_LEVEL");
        this.deployment = this.config.get("NODE_ENV");
        var logLevel;
        switch (this.setLogLevel) {
            case "DEBUG":
                logLevel = "debug";
                break;
            case "INFO":
                logLevel = "info";
                break;
            case "WARN":
                logLevel = "warn";
                break;
            case "ERROR":
                logLevel = "error";
                break;
            default:
                logLevel = "info";
                break;
        }
        var logTransports = [];
        switch (this.deployment) {
            case "development":
                logTransports = [
                    new winston_1.transports.Console()
                ];
                break;
            case "staging":
                logTransports = [
                    new winston_1.transports.Console(),
                    new Loggly({
                        token: this.config.get("LOGGLY_TOKEN"),
                        subdomain: this.config.get("LOGGLY_SUBDOMAIN"),
                        tags: this.config.get("LOGGLY_TAG") + "-staging",
                        json: true
                    })
                ];
                break;
            case "production":
                logTransports = [
                    new winston_1.transports.Console(),
                    new Loggly({
                        token: this.config.get("LOGGLY_TOKEN"),
                        subdomain: this.config.get("LOGGLY_SUBDOMAIN"),
                        tags: this.config.get("LOGGLY_TAG"),
                        json: true
                    })
                ];
                break;
            default:
                logTransports = [
                    new winston_1.transports.Console()
                ];
                break;
        }
        this.logger = (0, winston_1.createLogger)({
            level: logLevel,
            format: combine(errors({ stack: true }), timestamp(), json(), prettyPrint()),
            transports: logTransports
        });
    }
    getLogger(config) {
        return this.logger.child(config);
    }
    async close() {
        return new Promise((resolve, reject) => {
            try {
                this.logger.close();
                resolve(true);
            }
            catch (error) {
                console.log(error);
                reject(false);
            }
        });
    }
};
exports.LoggingService = LoggingService;
exports.LoggingService = LoggingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LoggingService);
//# sourceMappingURL=logging.service.js.map