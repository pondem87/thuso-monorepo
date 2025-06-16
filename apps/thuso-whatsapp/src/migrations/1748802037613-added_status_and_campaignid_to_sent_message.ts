import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedStatusAndCampaignidToSentMessage1748802037613 implements MigrationInterface {
    name = 'AddedStatusAndCampaignidToSentMessage1748802037613'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sent_message" ADD "status" character varying`);
        await queryRunner.query(`ALTER TABLE "sent_message" ADD "campaignId" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sent_message" DROP COLUMN "campaignId"`);
        await queryRunner.query(`ALTER TABLE "sent_message" DROP COLUMN "status"`);
    }

}
