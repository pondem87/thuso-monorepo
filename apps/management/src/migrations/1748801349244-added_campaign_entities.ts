import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedCampaignEntities1748801349244 implements MigrationInterface {
    name = 'AddedCampaignEntities1748801349244'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "campaign" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "name" character varying NOT NULL, "templateName" character varying NOT NULL, "templateId" uuid NOT NULL, "wabaId" character varying NOT NULL, "phoneNumberId" character varying NOT NULL, "components" text NOT NULL, "dailyMessageLimit" integer NOT NULL, "totalMessageLimit" integer NOT NULL, "totalMessagesSent" integer NOT NULL DEFAULT '0', "totalMessagesDelivered" integer NOT NULL DEFAULT '0', "totalMessagesRead" integer NOT NULL DEFAULT '0', "totalMessagesFailed" integer NOT NULL DEFAULT '0', "dispatchedMessages" integer NOT NULL DEFAULT '0', "failedDispatches" integer NOT NULL DEFAULT '0', "unfilteredClients" boolean NOT NULL DEFAULT false, "startedClientFiltering" boolean NOT NULL DEFAULT false, "failedClientFiltering" boolean NOT NULL DEFAULT false, "completedClientFiltering" boolean NOT NULL DEFAULT false, "biller" character varying NOT NULL, "approved" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0ce34d26e7f2eb316a3a592cdc4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "campaign_message" ("wamid" character varying NOT NULL, "status" character varying NOT NULL, "campaignId" uuid, CONSTRAINT "PK_a5392b1031bfcbaa6f219f85025" PRIMARY KEY ("wamid"))`);
        await queryRunner.query(`ALTER TABLE "campaign_message" ADD CONSTRAINT "FK_458248f32db63b91b0a6d10872b" FOREIGN KEY ("campaignId") REFERENCES "campaign"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "campaign_message" DROP CONSTRAINT "FK_458248f32db63b91b0a6d10872b"`);
        await queryRunner.query(`DROP TABLE "campaign_message"`);
        await queryRunner.query(`DROP TABLE "campaign"`);
    }

}
