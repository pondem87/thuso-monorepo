import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("")
export class MessageProcessorAccountData {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("uuid")
    accountId: string

    @Column("timestamp")
    subscriptionEndDate: Date

    @UpdateDateColumn()
    updatedAt: Date
}