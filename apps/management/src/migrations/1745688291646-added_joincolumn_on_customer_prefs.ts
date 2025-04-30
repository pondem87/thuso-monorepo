import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedJoincolumnOnCustomerPrefs1745688291646 implements MigrationInterface {
    name = 'AddedJoincolumnOnCustomerPrefs1745688291646'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_preferences" ADD "customerId" uuid`);
        await queryRunner.query(`ALTER TABLE "customer_preferences" ADD CONSTRAINT "UQ_aca1fdc0d00b7876fe33f188f79" UNIQUE ("customerId")`);
        await queryRunner.query(`ALTER TABLE "customer_preferences" ADD CONSTRAINT "FK_aca1fdc0d00b7876fe33f188f79" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_preferences" DROP CONSTRAINT "FK_aca1fdc0d00b7876fe33f188f79"`);
        await queryRunner.query(`ALTER TABLE "customer_preferences" DROP CONSTRAINT "UQ_aca1fdc0d00b7876fe33f188f79"`);
        await queryRunner.query(`ALTER TABLE "customer_preferences" DROP COLUMN "customerId"`);
    }

}
