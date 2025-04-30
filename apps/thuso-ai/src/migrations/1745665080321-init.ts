import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1745665080321 implements MigrationInterface {
    name = 'Init1745665080321'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat_topic" ("id" SERIAL NOT NULL, "date" date NOT NULL, "label" character varying NOT NULL, "chatHistoryUserId" character varying, "chatHistoryPhoneNumberId" character varying, CONSTRAINT "PK_de50ff4c78e8b1837f67cde8d39" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chat_history" ("userId" character varying NOT NULL, "phoneNumberId" character varying NOT NULL, "crmId" uuid, "wabaId" character varying NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cf16443559458d5599e78842f90" PRIMARY KEY ("userId", "phoneNumberId"))`);
        await queryRunner.query(`CREATE TABLE "chat_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "message" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "chatHistoryUserId" character varying, "chatHistoryPhoneNumberId" character varying, CONSTRAINT "PK_3cc0d85193aade457d3077dd06b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ai_business_profile" ("wabaId" character varying NOT NULL, "accountId" uuid NOT NULL, "profileId" uuid, "name" character varying, "tagline" character varying, "serviceDescription" character varying, "about" character varying, "imageLogoId" character varying, "imageBannerId" character varying, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_db4af60781bd1b987c2d2c1bb2c" PRIMARY KEY ("wabaId"))`);
        await queryRunner.query(`ALTER TABLE "chat_topic" ADD CONSTRAINT "FK_ec0ddff443d8443787925e9b841" FOREIGN KEY ("chatHistoryUserId", "chatHistoryPhoneNumberId") REFERENCES "chat_history"("userId","phoneNumberId") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD CONSTRAINT "FK_af91c9233891ce0430d5cc3e6c9" FOREIGN KEY ("chatHistoryUserId", "chatHistoryPhoneNumberId") REFERENCES "chat_history"("userId","phoneNumberId") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT "FK_af91c9233891ce0430d5cc3e6c9"`);
        await queryRunner.query(`ALTER TABLE "chat_topic" DROP CONSTRAINT "FK_ec0ddff443d8443787925e9b841"`);
        await queryRunner.query(`DROP TABLE "ai_business_profile"`);
        await queryRunner.query(`DROP TABLE "chat_message"`);
        await queryRunner.query(`DROP TABLE "chat_history"`);
        await queryRunner.query(`DROP TABLE "chat_topic"`);
    }

}
