import { Test, TestingModule } from '@nestjs/testing';
import { CrmService } from './crm.service';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Customer } from '../entities/customer.entity';
import { Preferences } from '../entities/prefs.entity';
import { CustomerAction } from '../entities/action.entity';
import { ThusoClientProxiesService } from '@lib/thuso-client-proxies';

describe('CrmService', () => {
  let service: CrmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrmService,
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: {}
        },
        {
          provide: getRepositoryToken(Preferences),
          useValue: {}
        },
        {
          provide: getRepositoryToken(CustomerAction),
          useValue: {}
        },
        {
          provide: ThusoClientProxiesService,
          useValue: {}
        },
        {
          provide: "IExternBusinessService",
          useValue: {}
        }
      ],
    }).compile();

    service = module.get<CrmService>(CrmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
