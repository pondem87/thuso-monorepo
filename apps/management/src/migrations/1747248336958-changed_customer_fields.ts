import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangedCustomerFields1747248336958 implements MigrationInterface {
    name = 'ChangedCustomerFields1747248336958'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer" ALTER COLUMN "gender" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer" ALTER COLUMN "gender" SET NOT NULL`);
    }

}
