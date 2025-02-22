import { INestApplication } from "@nestjs/common";
import { ManagementModule } from "../../src/management.module";
import { Test, TestingModule } from "@nestjs/testing";
import { generateRandomString, LONG_TEST_TIMEOUT } from "@lib/thuso-common";
import { Repository } from "typeorm";
import { User } from "../../src/accounts/entities/user.entity";
import { Account } from "../../src/accounts/entities/account.entity";
import { WhatsAppBusiness } from "../../src/businesses/entities/whatsapp-business.entity";
import { WhatsAppNumber } from "../../src/businesses/entities/whatsapp-number";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as bcrypt from 'bcrypt'
import { BusinessesService } from "../../src/businesses/businesses.service";
import { CreateBusinessDto } from "../../src/businesses/dto/create-business.dto"
import { ConfigService } from "@nestjs/config";


describe('Business Creations (e2e)', () => {
    let app: INestApplication;
    let userRepository: Repository<User>
    let accountRepository: Repository<Account>
    let businessRepository: Repository<WhatsAppBusiness>
    let appNumberRepository: Repository<WhatsAppNumber>
    let businessesService: BusinessesService
    let configService: ConfigService

    const testUserEmail1 = `${generateRandomString(8, "alpha-numeric")}@gmail.com`
    const testAccountName1 = `${generateRandomString(8, "alpha-numeric")}-pfitztronic`

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ManagementModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User))
        accountRepository = moduleFixture.get<Repository<Account>>(getRepositoryToken(Account))
        businessRepository = moduleFixture.get<Repository<WhatsAppBusiness>>(getRepositoryToken(WhatsAppBusiness))
        appNumberRepository = moduleFixture.get<Repository<WhatsAppNumber>>(getRepositoryToken(WhatsAppNumber))
        businessesService = moduleFixture.get<BusinessesService>(BusinessesService)
        configService = moduleFixture.get<ConfigService>(ConfigService)

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

        const businessData: CreateBusinessDto = {
            wabaId: "1234567890",
            phoneNumberId: "26778788986",
            exchangeToken: "dsoyfusIUIUUIYyufgfyYGuyYtguiyGuyiyTUy576TRygf",
        }

        const businessToken = "jfudhhdgkjuuhIhhihjdujifhIuhIUf98778yhHihuIhui879889HIUhu87ghyh"

        global.fetch = jest.fn().mockImplementation((...args) => {
            if (args[0] === `${configService.get<string>("FACEBOOK_GRAPH_API")}/oauth/access_token?client_id=${configService.get<string>("META_APP_ID")}&client_secret=${configService.get<string>("META_APP_SECRET")}&code=${businessData.exchangeToken}`) {
                return Promise.resolve({
                    ok: true,
                    text: () => Promise.resolve(businessToken),
                    json: () => Promise.resolve({ error: businessToken })
                })
            } else if (args[0] === `${configService.get<string>("FACEBOOK_GRAPH_API")}/${businessData.wabaId}/subscribed_apps`) {
                if (args[1].method === "POST" && args[1].headers.Authorization === `Bearer ${businessToken}`) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ success: true})
                    })
                } else {
                    return Promise.resolve({
                        ok: false,
                        json: () => Promise.resolve({ success: false})
                    })
                }
            } else if (args[0] === `${configService.get<string>("FACEBOOK_GRAPH_API")}/${businessData.phoneNumberId}/register`) {
                if (args[1].method === "POST" && args[1].headers.Authorization === `Bearer ${businessToken}`
                    && args[1].headers["Content-Type"] === "application/json") {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ success: true})
                    })
                } else {
                    return Promise.resolve({
                        ok: false,
                        json: () => Promise.resolve({ success: false})
                    })
                }
            } else {
                throw new Error(`Invalid URL: received (${args[0]})`)
            }
        })

        await businessesService.createWhatsAppBusiness(account1.id, businessData)

        const business = await businessRepository.findOne({ where: { wabaId: businessData.wabaId }})

        expect(business).toBeInstanceOf(WhatsAppBusiness)
        expect(business?.wabaId).toBe(businessData.wabaId)
        expect(business?.accountId).toBe(account1.id)
        expect(business.wabaToken).toBe(businessToken)
        expect(business.subscribed).toBe(true)

        const appNumber = await appNumberRepository.findOne({ where: { appNumberId: businessData.phoneNumberId }, relations: { waba: true }})

        expect(appNumber).toBeInstanceOf(WhatsAppNumber)
        expect(appNumber?.appNumberId).toBe(businessData.phoneNumberId)
        expect(appNumber?.accountId).toBe(account1.id)
        expect(appNumber.registered).toBe(true)
        expect(appNumber.waba.id).toBe(business.id)
    }, LONG_TEST_TIMEOUT)
})