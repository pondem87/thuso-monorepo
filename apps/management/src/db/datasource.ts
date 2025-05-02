// src/data-source.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load env vars
dotenv.config();

export default new DataSource({
    type: process.env.DB_TYPE === 'postgres' ? 'postgres' : 'sqlite',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: `${process.env.DB_DATABASE}-management`,
    entities: [`${process.env.APPS_FOLDER}/management/src/**/*.entity.js`],
    migrations: [`${process.env.APPS_FOLDER}/management/src/migrations/*.js`],
    migrationsRun: true,
    synchronize: false,
    extra: {
        ssl: {
            ca: fs.readFileSync(process.env.DB_CERT_PATH).toString(),
        },
    },
})