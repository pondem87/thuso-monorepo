import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from '../services/products.service';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { AuthService } from '../../auth/auth.service';
import { AccountsService } from '../../accounts/services/accounts.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

describe('ProductsController', () => {
  let controller: ProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {}
        },
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        },
        {
          provide: JwtService,
          useValue: {}
        },
        {
          provide: AuthService,
          useValue: {}
        },
        {
          provide: AccountsService,
          useValue: {}
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((input) => input)
          }
        }
      ]
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
