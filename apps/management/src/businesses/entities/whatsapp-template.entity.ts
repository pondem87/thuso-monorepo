import { TemplateStatus, WhatsAppTemplateType } from "@lib/thuso-common";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("whatsapp_template")
export class WhatsAppTemplate {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("uuid")
    accountId: string

    @Column("varchar")
    wabaId: string

    @Column("varchar", { nullable: true })
    templateId: string

    @Column("simple-json")
    template: WhatsAppTemplateType

    @Column("enum", { enum: TemplateStatus, nullable: true })
    status: string

    @Column("varchar", { nullable: true })
    quality: string

    @Column("varchar", { nullable: true })
    reason: string

    @Column("varchar", { nullable: true })
    otherInfo: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}