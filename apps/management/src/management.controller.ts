import { Controller, Get } from '@nestjs/common';
import { ManagementService } from './management.service';

@Controller()
export class ManagementController {
  constructor(private readonly managementService: ManagementService) {}

  @Get()
  getHealth(): string {
    return this.managementService.getHealth();
  }
}
