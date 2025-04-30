import { Test, TestingModule } from '@nestjs/testing';
import { CrmController } from './crm.controller';
import { JwtService } from '@nestjs/jwt';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { ConfigService } from '@nestjs/config';
import { AccountsService } from '../../accounts/services/accounts.service';
import { AuthService } from '../../auth/auth.service';
import { CrmService } from '../services/crm.service';

describe('CrmController', () => {
  let controller: CrmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrmController],
      providers: [
        {
          provide: JwtService,
          useValue: {}
        },
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((input) => input)
          }
        },
        {
          provide: AccountsService,
          useValue: {}
        },
        {
          provide: AuthService,
          useValue: {}
        },
        {
          provide: CrmService,
          useValue: {}
        }
      ]
    }).compile();

    controller = module.get<CrmController>(CrmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
