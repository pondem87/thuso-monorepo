import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MediaFile } from '../entities/media.entity';
import { ConfigService } from '@nestjs/config';
import { ThusoClientProxiesService } from '@lib/thuso-client-proxies';


describe('MediaService', () => {
  let service: MediaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediaService,
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        },
        {
          provide: getRepositoryToken(MediaFile),
          useValue: {}
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((input) => input)
          }
        },
        {
          provide: ThusoClientProxiesService,
          useValue: {}
        }
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
