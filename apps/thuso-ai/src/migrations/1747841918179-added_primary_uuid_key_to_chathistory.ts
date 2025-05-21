import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedBotnameToBusinessProfile1747841918179 implements MigrationInterface {
    name = 'AddedBotnameToBusinessProfile1747841918179'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT "FK_af91c9233891ce0430d5cc3e6c9"`);
        await queryRunner.query(`ALTER TABLE "chat_topic" DROP CONSTRAINT "FK_ec0ddff443d8443787925e9b841"`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "chatHistoryUserId"`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "chatHistoryPhoneNumberId"`);
        await queryRunner.query(`ALTER TABLE "chat_topic" DROP COLUMN "chatHistoryUserId"`);
        await queryRunner.query(`ALTER TABLE "chat_topic" DROP COLUMN "chatHistoryPhoneNumberId"`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD "chatHistoryId" uuid`);
        await queryRunner.query(`ALTER TABLE "chat_history" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "chat_history" DROP CONSTRAINT "PK_cf16443559458d5599e78842f90"`);
        await queryRunner.query(`ALTER TABLE "chat_history" ADD CONSTRAINT "PK_95fcc37cf4450936f3cc98310a8" PRIMARY KEY ("userId", "phoneNumberId", "id")`);
        await queryRunner.query(`ALTER TABLE "chat_topic" ADD "chatHistoryId" uuid`);
        await queryRunner.query(`ALTER TABLE "chat_history" DROP CONSTRAINT "PK_95fcc37cf4450936f3cc98310a8"`);
        await queryRunner.query(`ALTER TABLE "chat_history" ADD CONSTRAINT "PK_6b317b172d1069535fdca475166" PRIMARY KEY ("phoneNumberId", "id")`);
        await queryRunner.query(`ALTER TABLE "chat_history" DROP CONSTRAINT "PK_6b317b172d1069535fdca475166"`);
        await queryRunner.query(`ALTER TABLE "chat_history" ADD CONSTRAINT "PK_cf76a7693b0b075dd86ea05f21d" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "chat_history" ADD CONSTRAINT "UQ_cf16443559458d5599e78842f90" UNIQUE ("userId", "phoneNumberId")`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD CONSTRAINT "FK_4c772df41e9f3e87b644158fea7" FOREIGN KEY ("chatHistoryId") REFERENCES "chat_history"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_topic" ADD CONSTRAINT "FK_ac9964f6d17f966814682da3d4f" FOREIGN KEY ("chatHistoryId") REFERENCES "chat_history"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_topic" DROP CONSTRAINT "FK_ac9964f6d17f966814682da3d4f"`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT "FK_4c772df41e9f3e87b644158fea7"`);
        await queryRunner.query(`ALTER TABLE "chat_history" DROP CONSTRAINT "UQ_cf16443559458d5599e78842f90"`);
        await queryRunner.query(`ALTER TABLE "chat_history" DROP CONSTRAINT "PK_cf76a7693b0b075dd86ea05f21d"`);
        await queryRunner.query(`ALTER TABLE "chat_history" ADD CONSTRAINT "PK_6b317b172d1069535fdca475166" PRIMARY KEY ("phoneNumberId", "id")`);
        await queryRunner.query(`ALTER TABLE "chat_history" DROP CONSTRAINT "PK_6b317b172d1069535fdca475166"`);
        await queryRunner.query(`ALTER TABLE "chat_history" ADD CONSTRAINT "PK_95fcc37cf4450936f3cc98310a8" PRIMARY KEY ("userId", "phoneNumberId", "id")`);
        await queryRunner.query(`ALTER TABLE "chat_topic" DROP COLUMN "chatHistoryId"`);
        await queryRunner.query(`ALTER TABLE "chat_history" DROP CONSTRAINT "PK_95fcc37cf4450936f3cc98310a8"`);
        await queryRunner.query(`ALTER TABLE "chat_history" ADD CONSTRAINT "PK_cf16443559458d5599e78842f90" PRIMARY KEY ("userId", "phoneNumberId")`);
        await queryRunner.query(`ALTER TABLE "chat_history" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "chatHistoryId"`);
        await queryRunner.query(`ALTER TABLE "chat_topic" ADD "chatHistoryPhoneNumberId" character varying`);
        await queryRunner.query(`ALTER TABLE "chat_topic" ADD "chatHistoryUserId" character varying`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD "chatHistoryPhoneNumberId" character varying`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD "chatHistoryUserId" character varying`);
        await queryRunner.query(`ALTER TABLE "chat_topic" ADD CONSTRAINT "FK_ec0ddff443d8443787925e9b841" FOREIGN KEY ("chatHistoryUserId", "chatHistoryPhoneNumberId") REFERENCES "chat_history"("userId","phoneNumberId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD CONSTRAINT "FK_af91c9233891ce0430d5cc3e6c9" FOREIGN KEY ("chatHistoryUserId", "chatHistoryPhoneNumberId") REFERENCES "chat_history"("userId","phoneNumberId") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
