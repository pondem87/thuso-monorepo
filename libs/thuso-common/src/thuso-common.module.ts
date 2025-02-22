import { Module } from '@nestjs/common';
import { ThusoCommonService } from './thuso-common.service';
import { ApiAuthGuard } from './api-auth-guard';
import { LoggingModule } from '@lib/logging';

@Module({
  imports: [LoggingModule],
  providers: [ThusoCommonService, ApiAuthGuard],
  exports: [ThusoCommonService, ApiAuthGuard],
})
export class ThusoCommonModule {}
