import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedDeleteCascade1749312428606 implements MigrationInterface {
    name = 'AddedDeleteCascade1749312428606'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer_preferences" DROP CONSTRAINT "FK_aca1fdc0d00b7876fe33f188f79"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_number" DROP CONSTRAINT "FK_61680327f439acca794260c4a52"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_business" ADD "businessInitiaitedMessageLimit" integer NOT NULL DEFAULT '250'`);
        await queryRunner.query(`ALTER TABLE "customer_preferences" ADD CONSTRAINT "FK_aca1fdc0d00b7876fe33f188f79" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "whatsapp_number" ADD CONSTRAINT "FK_61680327f439acca794260c4a52" FOREIGN KEY ("wabaId") REFERENCES "whatsapp_business"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "whatsapp_number" DROP CONSTRAINT "FK_61680327f439acca794260c4a52"`);
        await queryRunner.query(`ALTER TABLE "customer_preferences" DROP CONSTRAINT "FK_aca1fdc0d00b7876fe33f188f79"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_business" DROP COLUMN "businessInitiaitedMessageLimit"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_number" ADD CONSTRAINT "FK_61680327f439acca794260c4a52" FOREIGN KEY ("wabaId") REFERENCES "whatsapp_business"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customer_preferences" ADD CONSTRAINT "FK_aca1fdc0d00b7876fe33f188f79" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
