import { MigrationInterface, QueryRunner } from "typeorm";

export class ReplaceCrmIdOnChathistory1747915636521 implements MigrationInterface {
    name = 'ReplaceCrmIdOnChathistory1747915636521'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_history" ADD "crmId" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_history" DROP COLUMN "crmId"`);
    }

}
