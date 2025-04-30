import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1745528794746 implements MigrationInterface {
    name = 'Init1745528794746'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "businessProfileId" uuid NOT NULL, "name" character varying NOT NULL, "shortDescription" character varying NOT NULL, "fullDetails" character varying NOT NULL, "price" character varying NOT NULL, "views" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "filename" character varying NOT NULL, "mimetype" character varying NOT NULL, "s3key" character varying NOT NULL, "productId" uuid, CONSTRAINT "PK_09d4639de8082a32aa27f3ac9a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."customer_action_actiontype_enum" AS ENUM('system-entry', 'user-entry')`);
        await queryRunner.query(`CREATE TABLE "customer_action" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "actionType" "public"."customer_action_actiontype_enum" NOT NULL, "description" character varying NOT NULL, "context" character varying, "customerId" uuid, CONSTRAINT "PK_15f2816d38621bc985d93ef0890" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."customer_gender_enum" AS ENUM('male', 'female')`);
        await queryRunner.query(`CREATE TABLE "customer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "forenames" character varying NOT NULL, "surname" character varying NOT NULL, "streetAd" character varying, "city" character varying NOT NULL, "country" character varying NOT NULL, "age" integer, "gender" "public"."customer_gender_enum" NOT NULL, "email" character varying, "whatsAppNumber" character varying NOT NULL, "notes" character varying, CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customer_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "emailPromo" boolean NOT NULL DEFAULT true, "emailUpdates" boolean NOT NULL DEFAULT true, "whatsAppPromo" boolean NOT NULL DEFAULT true, "whatsAppUpdates" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_20e6c37c7c01599737048da443b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "media_file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "name" character varying NOT NULL, "filename" character varying NOT NULL, "mimetype" character varying NOT NULL, "fileSize" integer NOT NULL, "s3Key" character varying NOT NULL, "description" character varying NOT NULL, "wabaId" character varying, "metaHandle" character varying, "handleFilename" character varying, "uploadSessionId" character varying, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cac82b29eea888470cc40043b76" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "document" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "businessProfileId" uuid NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "mimetype" character varying NOT NULL, "s3key" character varying NOT NULL, "embedded" boolean NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e57d3357f83f3cdc0acffc3d777" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."whatsapp_template_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED', 'PAUSED', 'PENDING_DELETION')`);
        await queryRunner.query(`CREATE TABLE "whatsapp_template" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "wabaId" character varying NOT NULL, "templateId" character varying, "template" text NOT NULL, "status" "public"."whatsapp_template_status_enum", "quality" character varying, "reason" character varying, "otherInfo" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_41eb07041707e03ff0127542566" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "business_profile" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "name" character varying NOT NULL, "tagline" character varying NOT NULL, "serviceDescription" character varying NOT NULL, "about" character varying NOT NULL, "imageLogoId" uuid, "imageBannerId" uuid, "wabaId" uuid, CONSTRAINT "REL_61022a0a7d61c502756dc932ac" UNIQUE ("wabaId"), CONSTRAINT "PK_e71e197c467c1ec2c45a1652110" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "whatsapp_business" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "wabaId" character varying NOT NULL, "name" character varying, "wabaToken" character varying NOT NULL, "subscribed" boolean NOT NULL DEFAULT false, "disabled" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1c1553d52816ac2bdbcdd9d089b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "whatsapp_number" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accountId" uuid NOT NULL, "appNumber" character varying, "appNumberId" character varying NOT NULL, "pin" character varying NOT NULL, "registered" boolean NOT NULL DEFAULT false, "wabaId" uuid, CONSTRAINT "PK_89e01f89b88f737683f4d80bbda" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invitation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "accountId" uuid, CONSTRAINT "PK_beb994737756c0f18a1c1f8669c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "maxAllowedBusinesses" bigint NOT NULL DEFAULT '2', "maxAllowedDailyConversations" integer NOT NULL DEFAULT '50', "disabled" boolean NOT NULL DEFAULT false, "subscriptionEndDate" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "rootId" uuid, CONSTRAINT "UQ_414d4052f22837655ff312168cb" UNIQUE ("name"), CONSTRAINT "REL_43b9f85fe06bf8b5614d2280d7" UNIQUE ("rootId"), CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "permission" ("id" SERIAL NOT NULL, "accountId" character varying NOT NULL, "entity" character varying NOT NULL, "action" character varying NOT NULL, "userId" uuid, CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "forenames" character varying NOT NULL, "surname" character varying NOT NULL, "passwordHash" character varying NOT NULL, "verified" boolean NOT NULL DEFAULT false, "verificationCode" character varying(6), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" character varying NOT NULL, "token" text NOT NULL, CONSTRAINT "UQ_9b8c6eac80e52d95241b573877f" UNIQUE ("token"), CONSTRAINT "PK_48cb6b5c20faa63157b3c1baf7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "account_users_user" ("accountId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_842689f456cd5ad1a04d91c17b8" PRIMARY KEY ("accountId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5067a588eb9fd2fe773a7b7b79" ON "account_users_user" ("accountId") `);
        await queryRunner.query(`CREATE INDEX "IDX_0ea6878752f3473032ebaabb86" ON "account_users_user" ("userId") `);
        await queryRunner.query(`ALTER TABLE "product_media" ADD CONSTRAINT "FK_50e3945c6150d80b69b5f18515a" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_action" ADD CONSTRAINT "FK_4fece6633a13aa25cf75b4a6df4" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business_profile" ADD CONSTRAINT "FK_61022a0a7d61c502756dc932ace" FOREIGN KEY ("wabaId") REFERENCES "whatsapp_business"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "whatsapp_number" ADD CONSTRAINT "FK_61680327f439acca794260c4a52" FOREIGN KEY ("wabaId") REFERENCES "whatsapp_business"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitation" ADD CONSTRAINT "FK_b464845926e47218f9bba3afda8" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account" ADD CONSTRAINT "FK_43b9f85fe06bf8b5614d2280d76" FOREIGN KEY ("rootId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "permission" ADD CONSTRAINT "FK_c60570051d297d8269fcdd9bc47" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "account_users_user" ADD CONSTRAINT "FK_5067a588eb9fd2fe773a7b7b796" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "account_users_user" ADD CONSTRAINT "FK_0ea6878752f3473032ebaabb86e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account_users_user" DROP CONSTRAINT "FK_0ea6878752f3473032ebaabb86e"`);
        await queryRunner.query(`ALTER TABLE "account_users_user" DROP CONSTRAINT "FK_5067a588eb9fd2fe773a7b7b796"`);
        await queryRunner.query(`ALTER TABLE "permission" DROP CONSTRAINT "FK_c60570051d297d8269fcdd9bc47"`);
        await queryRunner.query(`ALTER TABLE "account" DROP CONSTRAINT "FK_43b9f85fe06bf8b5614d2280d76"`);
        await queryRunner.query(`ALTER TABLE "invitation" DROP CONSTRAINT "FK_b464845926e47218f9bba3afda8"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_number" DROP CONSTRAINT "FK_61680327f439acca794260c4a52"`);
        await queryRunner.query(`ALTER TABLE "business_profile" DROP CONSTRAINT "FK_61022a0a7d61c502756dc932ace"`);
        await queryRunner.query(`ALTER TABLE "customer_action" DROP CONSTRAINT "FK_4fece6633a13aa25cf75b4a6df4"`);
        await queryRunner.query(`ALTER TABLE "product_media" DROP CONSTRAINT "FK_50e3945c6150d80b69b5f18515a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0ea6878752f3473032ebaabb86"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5067a588eb9fd2fe773a7b7b79"`);
        await queryRunner.query(`DROP TABLE "account_users_user"`);
        await queryRunner.query(`DROP TABLE "user_token"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "permission"`);
        await queryRunner.query(`DROP TABLE "account"`);
        await queryRunner.query(`DROP TABLE "invitation"`);
        await queryRunner.query(`DROP TABLE "whatsapp_number"`);
        await queryRunner.query(`DROP TABLE "whatsapp_business"`);
        await queryRunner.query(`DROP TABLE "business_profile"`);
        await queryRunner.query(`DROP TABLE "whatsapp_template"`);
        await queryRunner.query(`DROP TYPE "public"."whatsapp_template_status_enum"`);
        await queryRunner.query(`DROP TABLE "document"`);
        await queryRunner.query(`DROP TABLE "media_file"`);
        await queryRunner.query(`DROP TABLE "customer_preferences"`);
        await queryRunner.query(`DROP TABLE "customer"`);
        await queryRunner.query(`DROP TYPE "public"."customer_gender_enum"`);
        await queryRunner.query(`DROP TABLE "customer_action"`);
        await queryRunner.query(`DROP TYPE "public"."customer_action_actiontype_enum"`);
        await queryRunner.query(`DROP TABLE "product_media"`);
        await queryRunner.query(`DROP TABLE "product"`);
    }

}
