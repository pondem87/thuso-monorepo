import { Test, TestingModule } from '@nestjs/testing';
import { MessageProcessorService } from './message-processor.service';
import { MessageProcessingStateMachineProvider } from '../state-machines/message-processing.state-machine.provider';
import { AccountDataService } from './account-data.service';
import { LoggingService, mockedLoggingService } from '@lib/logging';
import { ThusoClientProxiesService } from '@lib/thuso-client-proxies';

describe('MessageProcessorService', () => {
	let service: MessageProcessorService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MessageProcessorService,
				{
					provide: MessageProcessingStateMachineProvider,
					useValue: {}
				},
				{
					provide: AccountDataService,
					useValue: {}
				},
				{
					provide: LoggingService,
					useValue: mockedLoggingService
				},
				{
					provide: ThusoClientProxiesService,
					useValue: {
						emitMgntQueue: jest.fn()
					}
				}
			],
		}).compile();

		service = module.get<MessageProcessorService>(MessageProcessorService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
