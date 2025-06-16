import { Column, CreateDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { WhatsAppNumber } from "./whatsapp-number.entity";
import { BusinessProfile } from "./business-profile.entity";

@Entity("whatsapp_business")
export class WhatsAppBusiness {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("uuid")
    accountId: string

    @Column("varchar")
    wabaId: string

    @Column("varchar", { nullable: true })
    name: string

    @Column("varchar")
    wabaToken: string

    @Column("boolean", { default: false })
    subscribed: boolean

    @Column("int", { default: 250 })
    businessInitiaitedMessageLimit: number

    @Column("boolean", { default: false })
    disabled: boolean

    @OneToOne(() => BusinessProfile, (businessProfile) => businessProfile.waba, { onDelete: "SET NULL" })
    businessProfile: BusinessProfile

    @OneToMany(() => WhatsAppNumber, (appNumber) => appNumber.waba)
    appNumbers: WhatsAppNumber[]

    @CreateDateColumn()
    createdAt: Date
}