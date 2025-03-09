import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class MessageProcessorAccountData {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar", { unique: true })
    phoneNumberId: string

    @Column("uuid")
    accountId: string

    @Column("varchar")
    wabaId: string

    @Column("varchar")
    wabaToken: string

    @Column("varchar")
    businessName: string

    @Column("varchar")
    tagline: string

    @Column("varchar")
    serviceDescription: string

    @Column("varchar")
    about: string

    @Column("timestamp", { nullable: true })
    subscriptionEndDate: Date

    @Column("boolean")
    disabled: boolean

    @UpdateDateColumn()
    updatedAt: Date
}