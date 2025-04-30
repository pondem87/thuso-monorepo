import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedOnboardingstateOnUser1745529630182 implements MigrationInterface {
    name = 'AddedOnboardingstateOnUser1745529630182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_onboardingstate_enum" AS ENUM('create-whatsapp-business', 'create-business-profile', 'onboarding-complete')`);
        await queryRunner.query(`ALTER TABLE "user" ADD "onboardingState" "public"."user_onboardingstate_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "onboardingState"`);
        await queryRunner.query(`DROP TYPE "public"."user_onboardingstate_enum"`);
    }

}
