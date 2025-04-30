import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class RunningMetrics {
    @PrimaryColumn("varchar")
    wabaId: string
    
    @PrimaryColumn("varchar")
    phoneNumberId: string

    @Column("int", { default: 0 })
    totalConversations: number

    @Column("timestamp", { nullable: true })
    lastResetTime: Date

    @UpdateDateColumn()
    updatedAt: Date
}