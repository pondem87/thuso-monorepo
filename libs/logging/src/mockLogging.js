"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockedLoggingService = void 0;
const logger = (...any) => console.log(...any);
exports.mockedLoggingService = {
    getLogger: () => ({
        debug: logger,
        info: logger,
        warn: logger,
        error: logger
    })
};
//# sourceMappingURL=mockLogging.js.map