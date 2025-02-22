import { Injectable } from '@nestjs/common';

@Injectable()
export class ThusoAiService {
  getHealth(): string {
    return 'Server Active!';
  }
}
