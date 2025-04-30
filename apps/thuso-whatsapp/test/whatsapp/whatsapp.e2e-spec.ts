import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ThusoWhatsappModule } from '../../src/thuso-whatsapp.module';
import { LONG_TEST_TIMEOUT, MessageProcessorEventPattern, MessageProcessorRMQMessage, WhatsappRmqClient } from '@lib/thuso-common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import AppDataSource from '../../src/db/datasource'

describe('Whatsapp webhook (e2e)', () => {
    let app: INestApplication;
    let configService: ConfigService;
    let testWhatsappRmqService: ClientProxy

    beforeEach(async () => {
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
                ThusoWhatsappModule
            ],
        })
        .overrideProvider(WhatsappRmqClient)
        .useValue({
            emit: jest.fn()
        })
        .compile();

        app = moduleFixture.createNestApplication();
        configService = moduleFixture.get<ConfigService>(ConfigService);

        await app.init();

        // Get the instance of the service
        testWhatsappRmqService = moduleFixture.get<ClientProxy>(WhatsappRmqClient);

    }, LONG_TEST_TIMEOUT);

    it('/whatsapp/webhook (GET): verify webhook - success', () => {
        return request(app.getHttpServer())
            .get(`/whatsapp/webhook?hub.mode=subscribe&hub.challenge=1158201444&hub.verify_token=${configService.get("WEBHOOK_VERIFY_TOKEN")}`)
            .expect(200)
            .expect("1158201444")
    }, LONG_TEST_TIMEOUT);

    it('/whatsapp/webhook (GET): verify webhook - failure', () => {
        return request(app.getHttpServer())
            .get(`/whatsapp/webhook?hub.mode=subscribe&hub.challenge=1158201444&hub.verify_token=some_rando_token_which_is_not_the_correct_one`)
            .expect(406)
            .then(response => {
                expect(response.body.message).toBe("VerifyToken could not be verified")
            })
    }, LONG_TEST_TIMEOUT);

    it('/whatsapp/webhook (POST): process webhook', async () => {
        await request(app.getHttpServer())
            .post('/whatsapp/webhook')
            .send({
                "object": "whatsapp_business_account",
                "entry": [{
                    "id": "WABA_ID",
                    "changes": [{
                        "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {
                                "display_phone_number": "PHONE_NUMBER",
                                "phone_number_id": "PHONE_NUMBER_ID"
                            },
                            "contacts": [{
                                "profile": {
                                    "name": "NAME"
                                },
                                "wa_id": "WHATSAPP_ID"
                            }],
                            "messages": [{
                                "from": "<WHATSAPP_USER_PHONE_NUMBER>",
                                "id": "<WHATSAPP_MESSAGE_ID>",
                                "timestamp": "<WEBHOOK_SENT_TIMESTAMP>",
                                "text": {
                                    "body": "<MESSAGE_BODY_TEXT>"
                                },
                                "type": "text"
                            }]
                        },
                        "field": "messages"
                    }]
                }]
            })
            .expect(200)
            .expect("OK")

        await new Promise((resolve) => setImmediate(resolve));

        // verify the message was emmitted to queue
        expect(testWhatsappRmqService.emit).toHaveBeenCalledWith(MessageProcessorEventPattern, {
            wabaId: "WABA_ID",
            metadata: {
                "display_phone_number": "PHONE_NUMBER",
                "phone_number_id": "PHONE_NUMBER_ID"
            },
            contact: {
                "profile": {
                    "name": "NAME"
                },
                "wa_id": "WHATSAPP_ID"
            },
            message: {
                "from": "<WHATSAPP_USER_PHONE_NUMBER>",
                "id": "<WHATSAPP_MESSAGE_ID>",
                "timestamp": "<WEBHOOK_SENT_TIMESTAMP>",
                "text": {
                    "body": "<MESSAGE_BODY_TEXT>"
                },
                "type": "text"
            }
        } as MessageProcessorRMQMessage)
    }, LONG_TEST_TIMEOUT);

});