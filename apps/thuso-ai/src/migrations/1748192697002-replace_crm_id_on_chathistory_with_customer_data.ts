import { MigrationInterface, QueryRunner } from "typeorm";

export class ReplaceCrmIdOnChathistoryWithCustomerData1748192697002 implements MigrationInterface {
    name = 'ReplaceCrmIdOnChathistoryWithCustomerData1748192697002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "customer_data" ("id" uuid NOT NULL, "fullName" character varying NOT NULL, CONSTRAINT "PK_4e800af4a146d5c8196a1149772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "chat_history" DROP COLUMN "crmId"`);
        await queryRunner.query(`ALTER TABLE "chat_history" ADD "unread" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "chat_history" ADD "customerDataId" uuid`);
        await queryRunner.query(`ALTER TABLE "chat_history" ADD CONSTRAINT "UQ_b515c76aee2b0f737980b35a7b8" UNIQUE ("customerDataId")`);
        await queryRunner.query(`ALTER TABLE "ai_business_profile" ADD "greeting" character varying`);
        await queryRunner.query(`ALTER TABLE "chat_history" ADD CONSTRAINT "FK_b515c76aee2b0f737980b35a7b8" FOREIGN KEY ("customerDataId") REFERENCES "customer_data"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_history" DROP CONSTRAINT "FK_b515c76aee2b0f737980b35a7b8"`);
        await queryRunner.query(`ALTER TABLE "ai_business_profile" DROP COLUMN "greeting"`);
        await queryRunner.query(`ALTER TABLE "chat_history" DROP CONSTRAINT "UQ_b515c76aee2b0f737980b35a7b8"`);
        await queryRunner.query(`ALTER TABLE "chat_history" DROP COLUMN "customerDataId"`);
        await queryRunner.query(`ALTER TABLE "chat_history" DROP COLUMN "unread"`);
        await queryRunner.query(`ALTER TABLE "chat_history" ADD "crmId" uuid`);
        await queryRunner.query(`DROP TABLE "customer_data"`);
    }

}
