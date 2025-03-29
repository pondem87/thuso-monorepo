import { Module } from '@nestjs/common';
import { ThusoCommonService } from './thuso-common.service';
import { ApiAuthGuard } from './api-auth-guard';
import { LoggingModule } from '@lib/logging';
import { GraphAPIService } from './graph-api.service';

@Module({
  imports: [LoggingModule],
  providers: [ThusoCommonService, ApiAuthGuard, GraphAPIService],
  exports: [ThusoCommonService, ApiAuthGuard, GraphAPIService],
})
export class ThusoCommonModule {}
