import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovedCrmIdFromChathistory1747914963148 implements MigrationInterface {
    name = 'RemovedCrmIdFromChathistory1747914963148'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_history" DROP COLUMN "crmId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_history" ADD "crmId" uuid`);
    }

}
