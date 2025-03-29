import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity("ai_business_profile")
export class BusinessProfile {
    @PrimaryColumn("varchar")
    wabaId: string

    @Column("uuid")
    accountId: string

    @Column("uuid")
    profileId: string

    @Column("varchar")
    name: string

    @Column("varchar")
    tagline: string

    @Column("varchar")
    serviceDescription: string

    @Column("varchar")
    about: string

    @Column("varchar")
    imageLogoId: string

    @Column("varchar")
    imageBannerId: string

    @UpdateDateColumn()
    updatedAt: Date
}