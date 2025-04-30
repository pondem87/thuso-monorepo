import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedFieldsToChathistory1745779560454 implements MigrationInterface {
    name = 'AddedFieldsToChathistory1745779560454'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_history" ADD "lastMessageTime" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "chat_history" ADD "lastTopic" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_history" DROP COLUMN "lastTopic"`);
        await queryRunner.query(`ALTER TABLE "chat_history" DROP COLUMN "lastMessageTime"`);
    }

}
