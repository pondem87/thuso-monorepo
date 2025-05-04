import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedTokenUsageEntity1746383889163 implements MigrationInterface {
    name = 'AddedTokenUsageEntity1746383889163'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "monthly_token_usage" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "wabaId" uuid NOT NULL, "inputTokens" integer NOT NULL, "outputTokens" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6ceb3ded274de15551f241fe72e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "monthly_token_usage"`);
    }

}
