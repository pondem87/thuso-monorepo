import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ThusoWhatsappModule } from '../../src/thuso-whatsapp.module';
import { LONG_TEST_TIMEOUT } from '@lib/thuso-common';
import { ConfigService } from '@nestjs/config';

describe('Whatsapp webhook (e2e)', () => {
    let app: INestApplication;
    let configService: ConfigService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ThusoWhatsappModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        configService = moduleFixture.get<ConfigService>(ConfigService);
        
        await app.init();
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
});