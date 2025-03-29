import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from './accounts.service';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Invitation } from '../entities/invitation.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { Account } from '../entities/account.entity';

describe('AccountsService', () => {
  let service: AccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
                  provide: LoggingService,
                  useValue: mockedLoggingService
                },
                {
                  provide: getRepositoryToken(User),
                  useValue: {}
                },
                {
                  provide: getRepositoryToken(Invitation),
                  useValue: {}
                },
                {
                  provide: getRepositoryToken(Account),
                  useValue: {}
                },
                {
                  provide: MailerService,
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

    service = module.get<AccountsService>(AccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
