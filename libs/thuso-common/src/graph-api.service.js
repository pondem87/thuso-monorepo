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
exports.GraphAPIService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const logging_1 = require("../../logging/src");
const FormData = require("form-data");
let GraphAPIService = class GraphAPIService {
    constructor(loggingService, configService) {
        this.loggingService = loggingService;
        this.configService = configService;
        this.logger = this.loggingService.getLogger({
            module: "whatsapp-messenger",
            file: "graph-api.service"
        });
        this.logger.info("Initialising GraphAPIService");
    }
    async messages(businessToken, phoneNumberId, messageBody) {
        try {
            this.logger.debug("Sending => Message: ", { messageBody });
            const response = await fetch(`${this.configService.get("FACEBOOK_GRAPH_API")}/${phoneNumberId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${businessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageBody)
            });
            if (!response.ok) {
                this.logger.error("Failed to send message.", { response: JSON.stringify(await response.json()) });
                return null;
            }
            const responseBody = await response.json();
            this.logger.debug("Message sent successfully.", { response: responseBody });
            return responseBody;
        }
        catch (error) {
            this.logger.error("Failed to send text message.", error);
            return null;
        }
    }
    async uploadMedia(businessToken, phoneNumberId, mediaType, mediaUrl) {
        try {
            this.logger.debug("Uploading file url: ", { mediaUrl });
            this.logger.debug("Uploading file type: ", { mediaType });
            const readStream = await axios_1.default.get(mediaUrl, { responseType: 'stream', timeout: 120000 });
            const formData = new FormData();
            formData.append("messaging_product", "whatsapp");
            formData.append("type", mediaType);
            formData.append("file", readStream.data, { contentType: mediaType });
            const response = await axios_1.default.post(`${this.configService.get("FACEBOOK_GRAPH_API")}/${phoneNumberId}/media`, formData, {
                headers: {
                    'Authorization': `Bearer ${businessToken}`,
                    ...formData.getHeaders()
                },
                timeout: 120000
            });
            if (!(response.status === 200 || response.status === 201)) {
                this.logger.error("Failed to upload image.", { response });
                return null;
            }
            return response.data.id;
        }
        catch (error) {
            this.logger.error("Failed to upload image.", error);
            return null;
        }
    }
};
exports.GraphAPIService = GraphAPIService;
exports.GraphAPIService = GraphAPIService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logging_1.LoggingService,
        config_1.ConfigService])
], GraphAPIService);
//# sourceMappingURL=graph-api.service.js.map