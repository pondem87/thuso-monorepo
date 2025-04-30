import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggingModule } from '@lib/logging';
import { ConfigService } from '@nestjs/config';
import { Document } from './entity/document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Document]), LoggingModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, ConfigService],
  exports: [TypeOrmModule]
})
export class DocumentsModule {}
