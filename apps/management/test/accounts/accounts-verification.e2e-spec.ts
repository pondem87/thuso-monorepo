import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ManagementModule } from '../../src/management.module';
import { generateRandomString, LONG_TEST_TIMEOUT } from '@lib/thuso-common';
import { Account } from '../../src/accounts/entities/account.entity';
import { User } from '../../src/accounts/entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { CreateAccountAndRootUserDto } from '../../src/accounts/dto/create-account-and-root-user.dto';
import * as bcrypt from 'bcrypt'
import { UserToken } from '../../src/auth/entities/user-token.entity';
import { JwtPayload } from '../../src/auth/types';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { ConfigService } from '@nestjs/config';
import AppDataSource from '../../src/db/datasource';

describe('ManagementController (e2e)', () => {
    let app: INestApplication;
    let userRepository: Repository<User>
    let accountRepository: Repository<Account>
    let userTokenRepository: Repository<UserToken>
    let jwtService: JwtService
    let configService: ConfigService

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
                ManagementModule],
        })
        .compile();

        app = moduleFixture.createNestApplication();

        await app.init();

        userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User))
        accountRepository = moduleFixture.get<Repository<Account>>(getRepositoryToken(Account))
        userTokenRepository = moduleFixture.get<Repository<UserToken>>(getRepositoryToken(UserToken))
        jwtService = moduleFixture.get<JwtService>(JwtService)
        configService = moduleFixture.get<ConfigService>(ConfigService)

        // make sure no duplicate records
        await accountRepository.delete({ name: testAccountName1 })
        await userRepository.delete({ email: testUserEmail1 })
    }, LONG_TEST_TIMEOUT);

    afterEach(async () => {
        await accountRepository.delete({ name: testAccountName1 })
        await userRepository.delete({ email: testUserEmail1 })
    }, LONG_TEST_TIMEOUT)

    it('should verify account and get user details', async () => {
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
                email: userData.email,
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

        // create token
        const jwtPayload: JwtPayload = {
            userId: user.id
        }

        const token = await jwtService.signAsync(jwtPayload, {
            secret: configService.get<string>("JWT_SECRET")
        })

        await userTokenRepository.save(
            userTokenRepository.create({
                userId: user.id,
                token
            })
        );

        const userRes = {
            ...user,
            verified: true,
            accounts: [],
            permissions: [],
        }
        
        delete userRes.passwordHash
        delete userRes.verificationCode

        // verify and check
        request(app.getHttpServer())
            .post('/management/accounts/verify')
            .set('Authorization', `Bearer ${token}`)  // Add the Authorization header
            .send({ verificationCode: user.verificationCode })  // Add JSON body
            .expect(202)
            .expect((response) => {
                expect(response.body).toEqual(expect.objectContaining({
                    ...userRes,
                    rootOf: expect.any(Object)
                }))
            });

        // get logged in user
        request(app.getHttpServer())
            .get('/management/accounts/this')
            .set('Authorization', `Bearer ${token}`)  // Add the Authorization header
            .expect(200)
            .expect((response) => {
                expect(response.body).toEqual(expect.objectContaining({
                    ...userRes,
                    rootOf: expect.any(Object)
                }))
            });
    }, LONG_TEST_TIMEOUT);
});