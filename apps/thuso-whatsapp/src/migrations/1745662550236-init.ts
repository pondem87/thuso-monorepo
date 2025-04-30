import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1745662550236 implements MigrationInterface {
    name = 'Init1745662550236'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "messenger_account" ("id" uuid NOT NULL, "maxAllowedDailyConversations" integer NOT NULL, "disabled" boolean NOT NULL DEFAULT false, "subscriptionEndDate" TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8c6f282c64cdb0d0ce3bec82d48" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "messenger_whats_app_business" ("wabaId" character varying NOT NULL, "wabaToken" character varying NOT NULL, "profileName" character varying, "tagLine" character varying, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "accountId" uuid, CONSTRAINT "PK_91880080513b46268c1a88adf5c" PRIMARY KEY ("wabaId"))`);
        await queryRunner.query(`CREATE TABLE "conversation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phoneNumberId" character varying NOT NULL, "userId" character varying NOT NULL, "type" character varying NOT NULL, "expiry" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_864528ec4274360a40f66c29845" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sent_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "wamid" character varying NOT NULL, "messageBody" text NOT NULL, "conversationId" uuid, CONSTRAINT "PK_37efcdbf204194da12b5b6b03ca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "daily_metrics" ("date" date NOT NULL, "phoneNumberId" character varying NOT NULL, "totalConversations" integer NOT NULL, CONSTRAINT "PK_c3014622c8afe6395973b399e68" PRIMARY KEY ("date"))`);
        await queryRunner.query(`CREATE TABLE "persisted_interactive_state" ("phoneNumberId" character varying NOT NULL, "userId" character varying NOT NULL, "persistedStateMachine" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0b0a44a91c7f493846486362c8f" PRIMARY KEY ("phoneNumberId", "userId"))`);
        await queryRunner.query(`CREATE TABLE "message_processor_account_data" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phoneNumberId" character varying, "accountId" uuid NOT NULL, "wabaId" character varying NOT NULL, "wabaToken" character varying NOT NULL, "businessName" character varying, "tagline" character varying, "serviceDescription" character varying, "about" character varying, "subscriptionEndDate" TIMESTAMP, "disabled" boolean NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7fe11bbb702d5f1c80e4adedc50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "messenger_whats_app_business" ADD CONSTRAINT "FK_b81cf6c867ec3d86b4e79416fc2" FOREIGN KEY ("accountId") REFERENCES "messenger_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sent_message" ADD CONSTRAINT "FK_1040bd6cab256d08a28f1f44af2" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sent_message" DROP CONSTRAINT "FK_1040bd6cab256d08a28f1f44af2"`);
        await queryRunner.query(`ALTER TABLE "messenger_whats_app_business" DROP CONSTRAINT "FK_b81cf6c867ec3d86b4e79416fc2"`);
        await queryRunner.query(`DROP TABLE "message_processor_account_data"`);
        await queryRunner.query(`DROP TABLE "persisted_interactive_state"`);
        await queryRunner.query(`DROP TABLE "daily_metrics"`);
        await queryRunner.query(`DROP TABLE "sent_message"`);
        await queryRunner.query(`DROP TABLE "conversation"`);
        await queryRunner.query(`DROP TABLE "messenger_whats_app_business"`);
        await queryRunner.query(`DROP TABLE "messenger_account"`);
    }

}
