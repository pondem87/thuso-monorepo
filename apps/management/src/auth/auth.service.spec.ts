import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../accounts/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UserToken } from './entities/user-token.entity';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
                  provide: LoggingService,
                  useValue: mockedLoggingService
                },
                {
                  provide: getRepositoryToken(User),
                  useValue: {}
                },
                {
                  provide: getRepositoryToken(UserToken),
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
