import { Module } from '@nestjs/common';
import { ManagementController } from './management.controller';
import { ManagementService } from './management.service';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { BusinessesModule } from './businesses/businesses.module';
import { DocumentsModule } from './documents/documents.module';
import { ProductsModule } from './products/products.module';
import * as fs from "fs"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env"] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: config.get<string>("DB_TYPE") === "postgres" ? "postgres" : "sqlite",
        host: config.get<string>("DB_HOST"),
        port: config.get<number>("DB_PORT"),
        username: config.get<string>("DB_USERNAME"),
        password: config.get<string>("DB_PASSWORD"),
        database: config.get<string>("DB_DATABASE"),
        autoLoadEntities: config.get<string>("DB_AUTOLOAD_ENTITIES") === "true",
        synchronize: config.get<string>("DB_SYNCHRONISE") === "true",
        extra: {
          ssl: {
            ca: fs.readFileSync(config.get<string>("DB_CERT_PATH"))
          }
        }
      }),
      inject: [ConfigService]
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule], // Import the ConfigModule to access environment variables
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST'),
          port: 465,
          secure: true,
          auth: {
            user: configService.get<string>('EMAIL_USERNAME'),
            pass: configService.get<string>('EMAIL_PASSWORD'),
          },
        },
      }),
      inject: [ConfigService]
    }),
    AccountsModule, AuthModule, BusinessesModule, DocumentsModule, ProductsModule],
  controllers: [ManagementController],
  providers: [ManagementService],
})
export class ManagementModule { }
