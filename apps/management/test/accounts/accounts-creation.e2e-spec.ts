import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ManagementModule } from '../../src/management.module';
import { AccountsController } from '../../src/accounts/accounts.controller';
import { CreateAccountAndRootUserDto } from '../../src/accounts/dto/create-account-and-root-user.dto';
import { Repository } from 'typeorm';
import { User } from '../../src/accounts/entities/user.entity';
import { Account } from '../../src/accounts/entities/account.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt'
import { MailerService } from '@nestjs-modules/mailer';
import { generateRandomString, LONG_TEST_TIMEOUT } from '@lib/thuso-common';

describe('Accounts Creation (e2e)', () => {
    let app: INestApplication;
    let accountsController: AccountsController
    let userRepository: Repository<User>
    let accountRepository: Repository<Account>
    let mailerService: MailerService
    let sendMailSpy: jest.SpyInstance

    const testUserEmail1 = `${generateRandomString(8, "alpha-numeric").toLowerCase()}@gmail.com`
    const testAccountName1 = `${generateRandomString(8, "alpha-numeric").toLowerCase()}-pfitztronic`

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ManagementModule],
        })
        .overrideProvider(MailerService).useValue({ sendMail: jest.fn() })
        .compile();

        app = moduleFixture.createNestApplication();
        accountsController = moduleFixture.get<AccountsController>(AccountsController)
        userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User))
        accountRepository = moduleFixture.get<Repository<Account>>(getRepositoryToken(Account))
        mailerService = moduleFixture.get<MailerService>(MailerService)
        await app.init();

        // get sendmail spy
        sendMailSpy = jest.spyOn(mailerService, "sendMail")

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

        expect(sendMailSpy).toHaveBeenCalledTimes(1)
        expect(sendMailSpy).toHaveBeenCalledWith(expect.objectContaining({
            to: data.email
        }))
    }, LONG_TEST_TIMEOUT);
});