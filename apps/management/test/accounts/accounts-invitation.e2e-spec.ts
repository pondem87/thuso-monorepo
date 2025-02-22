import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt'
import { MailerService } from '@nestjs-modules/mailer';
import { generateRandomString, LONG_TEST_TIMEOUT } from '@lib/thuso-common';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../../src/accounts/entities/user.entity';
import { Account } from '../../src/accounts/entities/account.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { ManagementModule } from '../../src/management.module';
import * as request from 'supertest';
import { Invitation } from '../../src/accounts/entities/invitation.entity';
import { UserToken } from '../../src/auth/entities/user-token.entity';


describe('Accounts Invitations (e2e)', () => {
    let app: INestApplication;
    let userTokenRepository: Repository<UserToken>
    let userRepository: Repository<User>
    let accountRepository: Repository<Account>
    let invitationRepository: Repository<Invitation>
    let mailerService: MailerService
    let sendMailSpy: jest.SpyInstance

    const testUserEmail1 = `${generateRandomString(8, "alpha-numeric")}@gmail.com`
    const testAccountName1 = `${generateRandomString(8, "alpha-numeric")}-pfitztronic`
    const testUserEmail2 = `${generateRandomString(8, "alpha-numeric")}@gmail.com`
    const testAccountName2 = `${generateRandomString(8, "alpha-numeric")}-pfitztronic`

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ManagementModule],
        })
        .overrideProvider(MailerService).useValue({ sendMail: jest.fn() })
        .compile();

        app = moduleFixture.createNestApplication();
        invitationRepository = moduleFixture.get<Repository<Invitation>>(getRepositoryToken(Invitation))
        userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User))
        accountRepository = moduleFixture.get<Repository<Account>>(getRepositoryToken(Account))
        userTokenRepository = moduleFixture.get<Repository<UserToken>>(getRepositoryToken(UserToken))
        mailerService = moduleFixture.get<MailerService>(MailerService)
        await app.init();

        // get sendmail spy
        sendMailSpy = jest.spyOn(mailerService, "sendMail")

        // make sure no duplicate records
        await invitationRepository.delete({})
        await accountRepository.delete({ name: testAccountName1 })
        await userRepository.delete({ email: testUserEmail1 })
        await userRepository.delete({ email: testUserEmail1 })
    }, LONG_TEST_TIMEOUT);

    afterAll(async () => {
        await invitationRepository.delete({ email: testUserEmail2 })
        await accountRepository.delete({ name: testAccountName1 })
        await userRepository.delete({ email: testUserEmail1 })
        await userRepository.delete({ email: testUserEmail1 })
    }, LONG_TEST_TIMEOUT)

    it("should invite user to join account", async () => {
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

        let token: string

        // login
        await request(app.getHttpServer())
            .post('/management/auth/login')
            .send({
                email: testUserEmail1,
                password: "abcdefghi"
            })
            .expect(res => {
                token = res.body.token
            })

        // send invitation
        const data = {
            email: testUserEmail2
        }

        await request(app.getHttpServer())
            .post(`/management/accounts/${account1.id}/invite-user`)
            .set('Authorization', `Bearer ${token}`)
            .send(data)
            .expect(201)
            .expect(res => {
                expect(res.body).toEqual({ message: "Invitation sent" })
            })

        // check email was sent
        expect(sendMailSpy).toHaveBeenCalledTimes(1)

        // check email was sent to correct address
        expect(sendMailSpy).toHaveBeenCalledWith(expect.objectContaining({
            to: testUserEmail2,
            subject: "Thuso Invitation",
            from: expect.any(String),
            text: expect.any(String),
            html: expect.any(String)
        }))

        // use invite
        const invite = await invitationRepository.findOneBy({ email: testUserEmail2 })

        await request(app.getHttpServer())
            .post(`/management/accounts/create-user/${invite.id}`)
            .send({
                email: testUserEmail2,
                forenames: "tendai precious",
                surname: "pfidze",
                password: "abcdefghi",
                repeatPassword: "abcdefghi",
            })
            .expect(res => {
                expect(res.body).toEqual({ email: testUserEmail2, accountName: testAccountName1 })
            })

        // check verication email was sent
        expect(sendMailSpy).toHaveBeenCalledTimes(2)
        expect(sendMailSpy).toHaveBeenCalledWith(expect.objectContaining({
            to: testUserEmail2,
            subject: "Account Verification",
            from: expect.any(String),
            text: expect.any(String),
            html: expect.any(String)
        }))


        // check user was added to account
        const user2 = await userRepository.findOne({ where: { email: testUserEmail2 }, relations: { accounts: true } })

        expect(user2.accounts).toHaveLength(1)
        expect(user2.accounts[0].name).toBe(testAccountName1)
        expect(user2.rootOf).toBeUndefined()

        // check invitation was deleted
        const invite2 = await invitationRepository.findOneBy({ email: testUserEmail2 })
        expect(invite2).toBeNull()

        await userTokenRepository.delete({ userId: user1.id })

    }, LONG_TEST_TIMEOUT)
})