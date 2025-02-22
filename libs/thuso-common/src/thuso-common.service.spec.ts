import { Test, TestingModule } from '@nestjs/testing';
import { ThusoCommonService } from './thuso-common.service';

describe('ThusoCommonService', () => {
  let service: ThusoCommonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThusoCommonService],
    }).compile();

    service = module.get<ThusoCommonService>(ThusoCommonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
