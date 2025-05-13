import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedBotnameToBusinessProfile1747154994813 implements MigrationInterface {
    name = 'AddedBotnameToBusinessProfile1747154994813'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_profile" ADD "botname" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_profile" DROP COLUMN "botname"`);
    }

}
