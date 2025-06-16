import { INestApplication } from "@nestjs/common";
import { ManagementModule } from "../../src/management.module";
import { Test, TestingModule } from "@nestjs/testing";
import { generateRandomString, LONG_TEST_TIMEOUT } from "@lib/thuso-common";
import { TypeOrmModule } from "@nestjs/typeorm";
import AppDataSource from '../../src/db/datasource';
import { ThusoClientProxiesService } from "@lib/thuso-client-proxies";

describe('Business Creations (e2e)', () => {
    let app: INestApplication;

    const testUserEmail1 = `${generateRandomString(8, "alpha-numeric")}@gmail.com`
    const testAccountName1 = `${generateRandomString(8, "alpha-numeric")}-pfitztronic`

    const client = {
        emitLlmQueue: jest.fn()
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
        .overrideProvider(ThusoClientProxiesService).useValue(client)
        .compile();
    }, LONG_TEST_TIMEOUT)

    it('Should create new business', async () => {})
})