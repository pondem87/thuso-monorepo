import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ManagementModule } from '../../src/management.module';
import { CreateAccountAndRootUserDto } from '../../src/accounts/dto/create-account-and-root-user.dto';
import { Repository } from 'typeorm';
import { User } from '../../src/accounts/entities/user.entity';
import { Account } from '../../src/accounts/entities/account.entity';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt'
import { generateRandomString, LONG_TEST_TIMEOUT, MgntRmqClient, UserUpdateAccountsPattern } from '@lib/thuso-common';
import { AccountsController } from '../../src/accounts/controllers/accounts.controller';
import AppDataSource from '../../src/db/datasource'

describe('Accounts Creation (e2e)', () => {
    let app: INestApplication;
    let accountsController: AccountsController
    let userRepository: Repository<User>
    let accountRepository: Repository<Account>

    const testUserEmail1 = `${generateRandomString(8, "alpha-numeric").toLowerCase()}@gmail.com`
    const testAccountName1 = `${generateRandomString(8, "alpha-numeric").toLowerCase()}-pfitztronic`

    const mgntQClient = { emit: jest.fn() }

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
            .overrideProvider(MgntRmqClient).useValue(mgntQClient)
            .compile();

        app = moduleFixture.createNestApplication();
        accountsController = moduleFixture.get<AccountsController>(AccountsController)
        userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User))
        accountRepository = moduleFixture.get<Repository<Account>>(getRepositoryToken(Account))
        await app.init();

        // make sure no duplicate records
        await accountRepository.delete({ name: testAccountName1 })
        await userRepository.delete({ email: testUserEmail1 })
    }, LONG_TEST_TIMEOUT);

    afterEach(async () => {
        // make sure no duplicate records
        await accountRepository.delete({ name: testAccountName1 })
        await userRepository.delete({ email: testUserEmail1 })
    })

    it('Should create new account', async () => {
        const data: CreateAccountAndRootUserDto = {
            email: testUserEmail1,
            forenames: "Tendai Precious",
            surname: "Pfidze",
            password: "abcdefghi",
            repeatPassword: "abcdefghi",
            accountName: testAccountName1
        }

        const res = await accountsController.createAccountAndRootUser(data)

        const account = await accountRepository.findOne({ where: { name: testAccountName1 }, relations: { root: true } })
        const user = await userRepository.findOne({ where: { email: testUserEmail1 }, relations: { rootOf: true } })

        expect(account).toBeInstanceOf(Account)
        expect(user).toBeInstanceOf(User)

        expect(account.name).toBe(data.accountName)
        expect(account.root?.email).toBe(data.email)

        expect(user.rootOf?.name).toBe(data.accountName)
        expect(await bcrypt.compare(data.password, user.passwordHash)).toBe(true)

        expect(res.email).toEqual(data.email)
        expect(res.accountName).toEqual(data.accountName)

        expect(mgntQClient.emit).toHaveBeenCalledTimes(1)
        expect(mgntQClient.emit).toHaveBeenCalledWith(
            UserUpdateAccountsPattern,
            {
                event: "NEW",
                userData: {
                    createdAt: user.createdAt,
                    email: user.email,
                    forenames: user.forenames,
                    surname: user.surname,
                    verificationCode: user.verificationCode,
                    verified: user.verified,
                    id: user.id
                }
            })
    }, LONG_TEST_TIMEOUT);
});