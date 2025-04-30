import { Module } from '@nestjs/common';
import { ManagementController } from './management.controller';
import { ManagementService } from './management.service';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessesModule } from './businesses/businesses.module';
import { DocumentsModule } from './documents/documents.module';
import { ProductsModule } from './products/products.module';
import { CrmModule } from './crm/crm.module';
import { MediaModule } from './media/media.module';
import AppDataSource from './db/datasource';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env"] }),
    TypeOrmModule.forRoot(AppDataSource.options),
    AccountsModule, AuthModule, BusinessesModule, DocumentsModule, ProductsModule, CrmModule, MediaModule],
  controllers: [ManagementController],
  providers: [ManagementService],
})
export class ManagementModule { }
