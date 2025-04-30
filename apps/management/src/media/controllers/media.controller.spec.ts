import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { JwtService } from '@nestjs/jwt';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { ConfigService } from '@nestjs/config';
import { AccountsService } from '../../accounts/services/accounts.service';
import { AuthService } from '../../auth/auth.service';
import { MediaService } from '../services/media.service';

describe('MediaController', () => {
  let controller: MediaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
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
          useValue: {}
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
          provide: MediaService,
          useValue: {}
        }
      ]
    }).compile();

    controller = module.get<MediaController>(MediaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
