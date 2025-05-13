import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity("ai_business_profile")
export class BusinessProfile {
    @PrimaryColumn("varchar")
    wabaId: string

    @Column("uuid")
    accountId: string

    @Column("uuid", { nullable: true })
    profileId: string

    @Column("varchar", { nullable: true })
    botname: string

    @Column("varchar", { nullable: true })
    name: string

    @Column("varchar", { nullable: true })
    tagline: string

    @Column("varchar", { nullable: true })
    serviceDescription: string

    @Column("varchar", { nullable: true })
    about: string

    @Column("varchar", { nullable: true })
    imageLogoId: string

    @Column("varchar", { nullable: true })
    imageBannerId: string

    @UpdateDateColumn()
    updatedAt: Date
}