import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ThusoWhatsappModule } from './../src/thuso-whatsapp.module';
import { LONG_TEST_TIMEOUT } from '@lib/thuso-common';

describe('ThusoWhatsappController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ThusoWhatsappModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, LONG_TEST_TIMEOUT);

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Server Active!');
  });
});
