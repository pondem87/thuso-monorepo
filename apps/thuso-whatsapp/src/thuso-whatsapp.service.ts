import { Injectable } from '@nestjs/common';

@Injectable()
export class ThusoWhatsappService {
  getHealth(): string {
    return 'Server Active!';
  }
}
