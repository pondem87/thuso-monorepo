import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AccountsService } from '../accounts/services/accounts.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
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
          provide: JwtService,
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

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
