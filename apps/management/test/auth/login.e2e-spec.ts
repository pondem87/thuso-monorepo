import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ManagementModule } from '../../src/management.module';
import { generateRandomString, LONG_TEST_TIMEOUT } from '@lib/thuso-common';
import { Account } from '../../src/accounts/entities/account.entity';
import { User } from '../../src/accounts/entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from '../../src/auth/auth.controller';
import { CreateAccountAndRootUserDto } from '../../src/accounts/dto/create-account-and-root-user.dto';
import * as bcrypt from 'bcrypt'
import { UserToken } from '../../src/auth/entities/user-token.entity';
import { UserDto } from '../../src/accounts/dto/response-dtos.dto';
import AppDataSource from '../../src/db/datasource';

describe('Login (e2e)', () => {
    let app: INestApplication;
    let userRepository: Repository<User>
    let accountRepository: Repository<Account>
    let userTokenRepository: Repository<UserToken>
    let authController: AuthController

    const testUserEmail1 = `${generateRandomString(8, "alpha-numeric")}@gmail.com`
    const testAccountName1 = `${generateRandomString(8, "alpha-numeric")}-pfitztronic`

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
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();

        userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User))
        accountRepository = moduleFixture.get<Repository<Account>>(getRepositoryToken(Account))
        userTokenRepository = moduleFixture.get<Repository<UserToken>>(getRepositoryToken(UserToken))
        authController = moduleFixture.get<AuthController>(AuthController)

        // make sure no duplicate records
        await accountRepository.delete({ name: testAccountName1 })
        await userRepository.delete({ email: testUserEmail1 })
    }, LONG_TEST_TIMEOUT);

    afterEach(async () => {
        await accountRepository.delete({ name: testAccountName1 })
        await userRepository.delete({ email: testUserEmail1 })
    }, LONG_TEST_TIMEOUT)

    it('should login', async () => {
        const userData: CreateAccountAndRootUserDto = {
            email: testUserEmail1,
            forenames: "Tendai Precious",
            surname: "Pfidze",
            password: "abcdefghi",
            repeatPassword: "abcdefghi",
            accountName: testAccountName1
        }

        // create account and user
        const user = await userRepository.save(
            userRepository.create({
                email: userData.email.toLocaleLowerCase().trim(),
                forenames: userData.forenames.toLowerCase().trim(),
                surname: userData.surname.toLowerCase().trim(),
                passwordHash: await bcrypt.hash(userData.password, await bcrypt.genSalt()),
                verified: false,
                verificationCode: "33FR2T"
            })
        )

        const account = await accountRepository.save(
            accountRepository.create({
                name: userData.accountName,
                root: user
            })
        )

        const res = await authController.login({
            email: userData.email,
            password: userData.password
        })

        expect(res.token).toEqual(expect.any(String))
        expect(res.user).toBeInstanceOf(UserDto)
        expect(res.user.email).toEqual(userData.email.toLowerCase().trim())
        expect(res.user.rootOf.id).toEqual(account.id)
        expect(res.user.accounts).toBeDefined()
        expect(res.user.accounts).toBeInstanceOf(Array)
        expect(res.user.permissions).toBeDefined()
        expect(res.user.permissions).toBeInstanceOf(Array)

        await userTokenRepository.delete({ userId: user.id })
    }, LONG_TEST_TIMEOUT);
});