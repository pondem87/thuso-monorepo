import { Biller, TemplateComponent } from "@lib/thuso-common";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Campaign {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("uuid")
    templateId: string

    @Column("varchar")
    phoneNumberId: string

    @Column("simple-json")
    components: TemplateComponent[]

    @Column("int")
    dailyMessageLimit: number

    @Column("int")
    totalMessageLimit: number

    @Column("int", { default: 0 })
    totalMessagesSent: number

    @Column("int", { default: 0 })
    totalMessagesDelivered: number

    @Column("int", { default: 0 })
    totalMessagesRead: number

    @Column("int", { default: 0 })
    totalMessagesFailed: number

    @Column("int", { default: 0 })
    dispatchedMessages: number

    @Column("int", { default: 0 })
    failedDispatches: number

    @Column("boolean", { default: false })
    unfilteredClients: boolean

    @Column("boolean", { default: false })
    startedClientFiltering: boolean

    @Column("boolean", { default: false })
    failedClientFiltering: boolean

    @Column("boolean", { default: false })
    completedClientFiltering: boolean

    @Column({ enum: Biller })
    biller: Biller

    @Column("boolean", { default: false })
    approved: boolean

    @CreateDateColumn()
    createdAt: Date
}