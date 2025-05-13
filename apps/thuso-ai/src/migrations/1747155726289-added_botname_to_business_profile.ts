import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedBotnameToBusinessProfile1747155726289 implements MigrationInterface {
    name = 'AddedBotnameToBusinessProfile1747155726289'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ai_business_profile" ADD "botname" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ai_business_profile" DROP COLUMN "botname"`);
    }

}
