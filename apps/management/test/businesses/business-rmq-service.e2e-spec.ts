import { INestApplication } from "@nestjs/common";
import { ManagementModule } from "../../src/management.module";
import { Test, TestingModule } from "@nestjs/testing";
import { CustomerRegistrationChatAgentEventPattern, generateRandomString, LONG_TEST_TIMEOUT, NewCustomerBusinessEventPayload } from "@lib/thuso-common";
import { Repository } from "typeorm";
import { User } from "../../src/accounts/entities/user.entity";
import { Account } from "../../src/accounts/entities/account.entity";
import { WhatsAppBusiness } from "../../src/businesses/entities/whatsapp-business.entity";
import { WhatsAppNumber } from "../../src/businesses/entities/whatsapp-number.entity";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import * as bcrypt from 'bcrypt'
import { CreateBusinessDto } from "../../src/businesses/dto/create-business.dto"
import AppDataSource from '../../src/db/datasource';
import { BusinessesRmqService } from "../../src/businesses/services/businesses.rmq.service";
import { v4 as uuidv4 } from "uuid"
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies";

describe('Business Creations (e2e)', () => {
    let app: INestApplication;
    let userRepository: Repository<User>
    let accountRepository: Repository<Account>
    let businessRepository: Repository<WhatsAppBusiness>
    let appNumberRepository: Repository<WhatsAppNumber>
    let businessesRmqService: BusinessesRmqService

    const testUserEmail1 = `${generateRandomString(8, "alpha-numeric")}@gmail.com`
    const testAccountName1 = `${generateRandomString(8, "alpha-numeric")}-pfitztronic`

    const client = {
        emitLlmQueue: jest.fn()
    }

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRootAsync({
                    useFactory: () => ({
                        ...AppDataSource.options,
                        autoLoadEntities: true,
                        entities: undefined,
                        migrations: undefined
                    })
                }),
                ManagementModule
            ],
        })
        .overrideProvider(ThusoClientProxiesService).useValue(client)
        .compile();

        app = moduleFixture.createNestApplication();
        userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User))
        accountRepository = moduleFixture.get<Repository<Account>>(getRepositoryToken(Account))
        businessRepository = moduleFixture.get<Repository<WhatsAppBusiness>>(getRepositoryToken(WhatsAppBusiness))
        appNumberRepository = moduleFixture.get<Repository<WhatsAppNumber>>(getRepositoryToken(WhatsAppNumber))
        businessesRmqService = moduleFixture.get<BusinessesRmqService>(BusinessesRmqService)

        await app.init();

        // make sure no duplicate records
        await accountRepository.delete({ name: testAccountName1 })
        await userRepository.delete({ email: testUserEmail1 })
    }, LONG_TEST_TIMEOUT)

    afterEach(async () => {
        // make sure no duplicate records
        const account = await accountRepository.findOneBy({ name: testAccountName1 })
        await appNumberRepository.delete({ accountId: account?.id })
        await businessRepository.delete({ accountId: account?.id })
        await accountRepository.delete({ name: testAccountName1 })
        await userRepository.delete({ email: testUserEmail1 })
        
    })

    it('Should create new business', async () => {
        // create account and user directly in database
        const user1 = await userRepository.save(
            userRepository.create({
                email: testUserEmail1,
                forenames: "tendai precious",
                surname: "pfidze",
                passwordHash: await bcrypt.hash("abcdefghi", await bcrypt.genSalt()),
                verified: true,
                verificationCode: null
            })
        )

        const account1 = await accountRepository.save(
            accountRepository.create({
                name: testAccountName1,
                root: user1
            })
        );

        const business = await businessRepository.save(
            businessRepository.create({
                wabaId: "1111111111",
                wabaToken: "jksdhjfkhlskhglksdfhlgkjf",
                accountId: account1.id
            })
        )

        const num = await appNumberRepository.save(
            appNumberRepository.create({
                appNumberId: "9998989898",
                accountId: account1.id,
                pin: "090909",
                waba: business
            })
        )

        const data: NewCustomerBusinessEventPayload = {
            initiator: "AI",
            whatsAppNumber: "2727272727",
            accountId: account1.id,
            crmId: uuidv4()
        }

        await businessesRmqService.processNewCustomer(data)

        expect(client.emitLlmQueue).toHaveBeenCalledWith(
            CustomerRegistrationChatAgentEventPattern,
            {
                crmId: data.crmId,
                wabaId: business.wabaId,
                whatsAppNumber: data.whatsAppNumber
            }
        )
        
    }, LONG_TEST_TIMEOUT)
})