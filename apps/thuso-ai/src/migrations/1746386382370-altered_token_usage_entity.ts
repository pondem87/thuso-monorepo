import { MigrationInterface, QueryRunner } from "typeorm";

export class AlteredTokenUsageEntity1746386382370 implements MigrationInterface {
    name = 'AlteredTokenUsageEntity1746386382370'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "monthly_token_usage" DROP COLUMN "wabaId"`);
        await queryRunner.query(`ALTER TABLE "monthly_token_usage" ADD "wabaId" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "monthly_token_usage" DROP COLUMN "wabaId"`);
        await queryRunner.query(`ALTER TABLE "monthly_token_usage" ADD "wabaId" uuid NOT NULL`);
    }

}
