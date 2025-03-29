import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from '../services/accounts.service';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { AuthService } from '../../auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

describe('AccountsController', () => {
  let controller: AccountsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: AccountsService,
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
        }
      ]
    }).compile();

    controller = module.get<AccountsController>(AccountsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
