import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
                  provide: LoggingService,
                  useValue: mockedLoggingService
                },
                {
                  provide: getRepositoryToken(Product),
                  useValue: {}
                },
                {
                  provide: ConfigService,
                  useValue: {
                    get: jest.fn().mockImplementation((input) => input)
                  }
                }
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
