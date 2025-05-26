import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedGreetingToBusinessProfile1748194453022 implements MigrationInterface {
    name = 'AddedGreetingToBusinessProfile1748194453022'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_profile" ADD "greeting" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_profile" DROP COLUMN "greeting"`);
    }

}
