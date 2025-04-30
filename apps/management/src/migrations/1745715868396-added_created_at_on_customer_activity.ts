import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedCreatedAtOnCustomerActivity1745715868396 implements MigrationInterface {
    name = 'AddedCreatedAtOnCustomerActivity1745715868396'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_action" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_action" DROP COLUMN "createdAt"`);
    }

}
