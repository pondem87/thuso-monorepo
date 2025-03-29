import { Test, TestingModule } from '@nestjs/testing';
import { BusinessesController } from './businesses.controller';
import { JwtService } from '@nestjs/jwt';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { AuthService } from '../../auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { AccountsService } from '../../accounts/services/accounts.service';
import { BusinessesService } from '../services/businesses.service';

describe('BusinessesController', () => {
  let controller: BusinessesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        BusinessesController
      ],
      providers: [
        {
          provide: BusinessesService,
          useValue: {}
        },
        {
          provide: JwtService,
          useValue: {}
        },
        {
          provide: LoggingService,
          useValue: mockedLoggingService
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
        },
      ]
    }).compile();

    controller = module.get<BusinessesController>(BusinessesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
