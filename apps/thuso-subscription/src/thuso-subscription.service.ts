import { Injectable } from '@nestjs/common';

@Injectable()
export class ThusoSubscriptionService {
  getHello(): string {
    return 'Hello World!';
  }
}
