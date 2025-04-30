import { Test, TestingModule } from '@nestjs/testing';
import { ThusoClientProxiesService } from './thuso-client-proxies.service';

describe('ThusoClientProxiesService', () => {
  let service: ThusoClientProxiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThusoClientProxiesService],
    }).compile();

    service = module.get<ThusoClientProxiesService>(ThusoClientProxiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
