import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class MessageProcessorAccountData {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar")
    phoneNumberId: string

    @Column("uuid")
    accountId: string

    @Column("varchar")
    wabaId: string

    @Column("varchar")
    wabaToken: string

    @Column("varchar", { nullable: true})
    businessName: string

    @Column("varchar", { nullable: true })
    tagline: string

    @Column("varchar", { nullable: true })
    serviceDescription: string

    @Column("varchar", { nullable: true })
    about: string

    @Column("timestamp", { nullable: true })
    subscriptionEndDate: Date

    @Column("boolean")
    disabled: boolean

    @UpdateDateColumn()
    updatedAt: Date
}