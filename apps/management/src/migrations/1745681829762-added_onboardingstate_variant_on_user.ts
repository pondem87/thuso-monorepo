import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedOnboardingstateVariantOnUser1745681829762 implements MigrationInterface {
    name = 'AddedOnboardingstateVariantOnUser1745681829762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."user_onboardingstate_enum" RENAME TO "user_onboardingstate_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_onboardingstate_enum" AS ENUM('create-whatsapp-business', 'create-business-profile', 'read-next-steps', 'onboarding-complete')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "onboardingState" TYPE "public"."user_onboardingstate_enum" USING "onboardingState"::"text"::"public"."user_onboardingstate_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_onboardingstate_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_onboardingstate_enum_old" AS ENUM('create-whatsapp-business', 'create-business-profile', 'onboarding-complete')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "onboardingState" TYPE "public"."user_onboardingstate_enum_old" USING "onboardingState"::"text"::"public"."user_onboardingstate_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."user_onboardingstate_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_onboardingstate_enum_old" RENAME TO "user_onboardingstate_enum"`);
    }

}
