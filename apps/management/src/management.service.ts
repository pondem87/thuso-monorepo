import { Injectable } from '@nestjs/common';

@Injectable()
export class ManagementService {
  getHealth(): string {
    return 'Server Active!';
  }
}
