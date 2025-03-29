const logger = (...any) => console.log(...any)

export const mockedLoggingService = {
    getLogger: () => ({
        debug: logger,
        info: logger,
        warn: logger,
        error: logger
    })
}