import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { WhatsAppBusiness } from "./whatsapp-business.entity";

@Entity("business_profile")
export class BusinessProfile {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("uuid")
    accountId: string

    @Column("varchar")
    name: string

    @Column("varchar")
    tagline: string

    @Column("varchar")
    serviceDescription: string

    @Column("varchar")
    about: string

    @Column("uuid", { nullable: true })
    imageLogoId: string

    @Column("uuid", { nullable: true })
    imageBannerId: string

    @OneToOne(() => WhatsAppBusiness, (waba) => waba.businessProfile, { onDelete: "SET NULL"})
    @JoinColumn()
    waba: WhatsAppBusiness
}