import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createLogger, transports, format, Logger } from "winston"

// import * as Loggly from "winston-loggly-bulk"
const { Loggly } = require('winston-loggly-bulk')

const { combine, timestamp, json, errors, prettyPrint } = format

@Injectable()
export class LoggingService {
    private logger: Logger
    private setLogLevel: string
    private deployment: string

    constructor(
        private config: ConfigService
    ) {
        this.setLogLevel = this.config.get<string>("LOG_LEVEL")

        // Options are "development" or "production"
        this.deployment = this.config.get<string>("NODE_ENV")

        var logLevel: string

        switch (this.setLogLevel) {
            case "DEBUG":
                logLevel = "debug"
                break;

            case "INFO":
                logLevel = "info"
                break;

            case "WARN":
                logLevel = "warn"
                break;

            case "ERROR":
                logLevel = "error"
                break;

            default:
                logLevel = "info"
                break;
        }

        var logTransports = []

        switch (this.deployment) {
            case "development":
                logTransports = [
                    new transports.Console()
                ]
                break

            case "staging":
                logTransports = [
                    new transports.Console(),
                    new Loggly({
                        token: this.config.get<string>("LOGGLY_TOKEN"),
                        subdomain: this.config.get<string>("LOGGLY_SUBDOMAIN"),
                        tags: this.config.get<string>("LOGGLY_TAG") + "-staging",
                        json: true
                    })
                ]
                break

            case "production":
                logTransports = [
                    new transports.Console(),
                    new Loggly({
                        token: this.config.get<string>("LOGGLY_TOKEN"),
                        subdomain: this.config.get<string>("LOGGLY_SUBDOMAIN"),
                        tags: this.config.get<string>("LOGGLY_TAG"),
                        json: true
                    })
                ]
                break

            default:
                logTransports = [
                    new transports.Console()
                ]
                break
        }

        this.logger = createLogger({
            level: logLevel,
            format: combine(
                errors({ stack: true }),
                timestamp(),
                json(),
                prettyPrint()
            ),
            transports: logTransports
        })
    }

    getLogger(config: {
        module: string
        file: string
    }): Logger {
        return this.logger.child(config)
    }

    async close(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                this.logger.close();
                resolve(true);
            } catch (error) {
                console.log(error)
                reject(false)
            }
        });
    }
}