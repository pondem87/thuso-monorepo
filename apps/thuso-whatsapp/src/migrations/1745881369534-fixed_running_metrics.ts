import { MigrationInterface, QueryRunner } from "typeorm";

export class FixedRunningMetrics1745881369534 implements MigrationInterface {
    name = 'FixedRunningMetrics1745881369534'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "running_metrics" ("wabaId" character varying NOT NULL, "phoneNumberId" character varying NOT NULL, "totalConversations" integer NOT NULL DEFAULT '0', "lastResetTime" TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_28354e7a6429bba6bf3027f7487" PRIMARY KEY ("wabaId", "phoneNumberId"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "running_metrics"`);
    }

}
