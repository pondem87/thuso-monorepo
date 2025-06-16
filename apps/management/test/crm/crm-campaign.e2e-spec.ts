import { Biller, CampaignLaunchEventPattern, CampaignMessageStatusUpdatePayload, LONG_TEST_TIMEOUT } from "@lib/thuso-common";
import { INestApplication } from "@nestjs/common";
import { TestingModule, Test } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { ManagementModule } from "../../src/management.module";
import { Repository } from "typeorm";
import AppDataSource from '../../src/db/datasource'
import { Campaign } from "../../src/crm/entities/campaign.entity";
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies";
import { CampaignController } from "../../src/crm/controllers/crm.campaign.controller";
import { CreateCampaignDto } from "../../src/crm/dto/create-campaign.dto";
import { v4 as uuidv4 } from "uuid";
import { CampaignRmqController } from "../../src/crm/controllers/crm.campaign.rmq.controller";
import { Customer } from "../../src/crm/entities/customer.entity";
import { CreateCustomerDto } from "apps/management/src/crm/dto/create-customer.dto";
import { Preferences } from "../../src/crm/entities/prefs.entity";

describe('Campaigns (e2e)', () => {
    let app: INestApplication;
    let campaignRepo: Repository<Campaign>
    let customerRepo: Repository<Customer>
    let prefsRepo: Repository<Preferences>
    let campaignController: CampaignController
    let campaignRmqCon: CampaignRmqController


    const rmqClientService = {
        emitMgntQueue: jest.fn(),
        emitWhatsappQueue: jest.fn()
    }
    const businessService = {
        getBusinessByWabaId: null
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
            .overrideProvider(ThusoClientProxiesService).useValue(rmqClientService)
            .overrideProvider("IExternBusinessService").useValue(businessService)
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        campaignRepo = moduleFixture.get<Repository<Campaign>>(getRepositoryToken(Campaign));
        campaignController = moduleFixture.get<CampaignController>(CampaignController);
        customerRepo = moduleFixture.get<Repository<Customer>>(getRepositoryToken(Customer));
        prefsRepo = moduleFixture.get<Repository<Preferences>>(getRepositoryToken(Preferences));
        campaignRmqCon = moduleFixture.get<CampaignRmqController>(CampaignRmqController);

        // make sure no duplicate records
    }, LONG_TEST_TIMEOUT);

    it("Should create new campaign and send first batch of messages", async () => {
        const accountId = uuidv4()
        const input: CreateCampaignDto = {
            wabaId: "WABA_ID",
            phoneNumberId: "PHONE_NUMBER_ID",
            name: "Summer promo 1",
            templateId: uuidv4(),
            templateName: "summer_promo_1",
            components: [
                {
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: "first"
                        },
                        {
                            type: "text",
                            text: "second"
                        }
                    ]
                }
            ],
            totalMessageLimit: 10,
            unfilteredClients: true,
            biller: "whatsapp" as Biller
        }

        businessService.getBusinessByWabaId = jest.fn().mockResolvedValue({
            businessInitiaitedMessageLimit: 250
        })

        await campaignController.createCampaign(accountId, input);

        let campaign = await campaignRepo.findOneBy({ templateId: input.templateId });

        expect(campaign).toBeTruthy();
        expect(campaign.templateId).toBe(input.templateId)
        expect(campaign.approved).toBe(true);
        expect(rmqClientService.emitMgntQueue).toHaveBeenCalledWith(
            CampaignLaunchEventPattern,
            {
                campaignId: campaign.id
            }
        )

        // add test some users
        const testUsers = userData

        let i = 0
        for (const data of testUsers) {
            await customerRepo.save(
                customerRepo.create({
                    accountId,
                    ...data,
                    prefs: await prefsRepo.save(
                        prefsRepo.create({
                            whatsAppPromo: i % 2 === 0,
                            whatsAppUpdates: true,
                            emailPromo: true,
                            emailUpdates: true
                        })
                    )
                })
            )
            i++;
        }

        await campaignRmqCon.handleCampaignLaunch({ campaignId: campaign.id })

        expect(rmqClientService.emitWhatsappQueue).toHaveBeenCalledTimes(Math.ceil(testUsers.length/2))

        campaign = await campaignRepo.findOneBy({ templateId: input.templateId });

        expect(campaign).toBeTruthy()
        expect(campaign.dispatchedMessages).toBe(Math.ceil(testUsers.length/2))

        await customerRepo.delete({ accountId })
        await campaignRepo.delete({ accountId });
    }, LONG_TEST_TIMEOUT)

    it("should update campaig message statuses", async () => {
        const accountId = uuidv4()
        const input: CreateCampaignDto = {
            wabaId: "WABA_ID",
            phoneNumberId: "PHONE_NUMBER_ID",
            name: "Summer promo 1",
            templateId: uuidv4(),
            templateName: "summer_promo_1",
            components: [
                {
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: "first"
                        },
                        {
                            type: "text",
                            text: "second"
                        }
                    ]
                }
            ],
            totalMessageLimit: 10,
            unfilteredClients: true,
            biller: "whatsapp" as Biller
        }

        const campaign = await campaignRepo.save(
            campaignRepo.create({
                accountId,
                ...input,
                dailyMessageLimit: 250
            })
        )

        const dsUpdates = dispatchUpdates;
        const wsUpdates = whatsappUpdates;

        for (const update of dsUpdates) {
            const data: CampaignMessageStatusUpdatePayload = {
                campaignId: campaign.id,
                messageId: update.messageId,
                status: update.status as "sent" | "read" | "delivered" | "failed"
            }
            await campaignRmqCon.handleCampaignMessageStatusUpdate(data);
        }

        for (const update of wsUpdates) {
            const data: CampaignMessageStatusUpdatePayload = {
                campaignId: campaign.id,
                messageId: update.messageId,
                status: update.status as "sent" | "read" | "delivered" | "failed"
            }
            await campaignRmqCon.handleCampaignMessageStatusUpdate(data);
        }

        const newCampaign = await campaignRepo.findOne({ where: { id: campaign.id }, relations: { campaignMessages: true }})

        expect(newCampaign).toBeTruthy()
        expect(newCampaign.totalMessagesSent).toBe(7)
        expect(newCampaign.totalMessagesDelivered).toBe(4)
        expect(newCampaign.totalMessagesFailed).toBe(5)

        await campaignRepo.delete({ accountId });
    }, LONG_TEST_TIMEOUT)


})

const userData: CreateCustomerDto[] = [
    {
        forenames: 'Alice',
        surname: 'Moyo',
        streetAd: '123 Unity Road',
        city: 'Gaborone',
        country: 'Botswana',
        age: 29,
        whatsAppNumber: '+26771234501'
    },
    {
        forenames: 'Brian',
        surname: 'Phiri',
        streetAd: '456 Tech Street',
        city: 'Francistown',
        country: 'Botswana',
        age: 34,
        whatsAppNumber: '+26771234502'
    },
    {
        forenames: 'Charity',
        surname: 'Dube',
        streetAd: '789 Market Avenue',
        city: 'Maun',
        country: 'Botswana',
        age: 41,
        whatsAppNumber: '+26771234503'
    },
    {
        forenames: 'David',
        surname: 'Kgosi',
        city: 'Gaborone',
        country: 'Botswana',
        age: 23,
        whatsAppNumber: '+26771234504',
    },
    {
        forenames: 'Eunice',
        surname: 'Motlalepula',
        streetAd: 'Plot 99',
        city: 'Serowe',
        country: 'Botswana',
        age: 37,
        email: 'eunice.m@example.com',
        whatsAppNumber: '+26771234505'
    },
];

const dispatchUpdates = [
    { messageId: "msg_1a2b", status: "sent" },
    { messageId: "msg_2b3c", status: "sent" },
    { messageId: "msg_3c4d", status: "sent" },
    { messageId: "msg_4d5e", status: "sent" },
    { messageId: "msg_5e6f", status: "sent" },
    { messageId: "msg_6f7g", status: "sent" },
    { messageId: "msg_7g8h", status: "sent" },

    // "failed" entries do not have messageId
    { messageId: null, status: "failed" },
    { messageId: null, status: "failed" },
    { messageId: null, status: "failed" },
];

const whatsappUpdates = [
    { messageId: "msg_1a2b", status: "delivered" },
    { messageId: "msg_2b3c", status: "delivered" },
    { messageId: "msg_3c4d", status: "delivered" },
    { messageId: "msg_4d5e", status: "delivered" },
    { messageId: "msg_5e6f", status: "sent" },

    // "failed" entries do not have messageId
    { messageId: "msg_6f7g", status: "failed" },
    { messageId: "msg_7g8h", status: "failed" },
];
