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
exports.ApiAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const logging_1 = require("../../logging/src");
const config_1 = require("@nestjs/config");
let ApiAuthGuard = class ApiAuthGuard {
    constructor(loggingService, configService) {
        this.loggingService = loggingService;
        this.configService = configService;
        this.logger = this.loggingService.getLogger({
            module: "ThusoCommon",
            file: "api-auth-guard"
        });
        this.logger.info("Init ApiAuthGuard");
        this.apiToken = this.configService.get("THUSO_S2S_TOKEN");
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        this.logger.debug("Extracted token from header", { token });
        if (!token) {
            throw new common_1.UnauthorizedException();
        }
        if (token !== this.apiToken) {
            throw new common_1.UnauthorizedException();
        }
        this.logger.debug("Token is valid", { token });
        return true;
    }
    extractTokenFromHeader(request) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
};
exports.ApiAuthGuard = ApiAuthGuard;
exports.ApiAuthGuard = ApiAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logging_1.LoggingService,
        config_1.ConfigService])
], ApiAuthGuard);
//# sourceMappingURL=api-auth-guard.js.map