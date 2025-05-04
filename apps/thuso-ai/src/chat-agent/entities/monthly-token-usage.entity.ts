import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class MonthlyTokenUsage {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar")
    wabaId: string

    @Column("int")
    inputTokens: number

    @Column("int")
    outputTokens: number

    @CreateDateColumn()
    createdAt: Date
}