import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class DailyMetrics {
    @PrimaryColumn("date")
    date: string

    @Column("varchar")
    phoneNumberId: string

    @Column("int")
    totalConversations: number
}