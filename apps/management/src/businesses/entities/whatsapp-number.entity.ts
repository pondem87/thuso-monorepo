import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { WhatsAppBusiness } from "./whatsapp-business.entity";

@Entity("whatsapp_number")
export class WhatsAppNumber {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("uuid")
    accountId: string

    @Column("varchar", { nullable: true })
    appNumber: string

    @Column("varchar")
    appNumberId: string

    @Column("varchar")
    pin: string

    @Column("boolean", { default: false })
    registered: boolean

    @ManyToOne(() => WhatsAppBusiness, (waba) => waba.appNumbers, { onDelete: "CASCADE" })
    waba: WhatsAppBusiness
}