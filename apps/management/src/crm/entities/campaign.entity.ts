import { Biller, Component } from "@lib/thuso-common";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { CampaignMessage } from "./campaign-message.entity";

@Entity()
export class Campaign {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("uuid")
    accountId: string

    @Column("varchar")
    name: string

    @Column("varchar")
    templateName: string

    @Column("uuid")
    templateId: string

    @Column("varchar")
    wabaId: string

    @Column("varchar")
    phoneNumberId: string

    @Column("simple-json")
    components: Component[]

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

    @OneToMany(() => CampaignMessage, (campaignMessage) => campaignMessage.campaign)
    campaignMessages: CampaignMessage[]

    @Column({ enum: Biller })
    biller: Biller

    @Column("boolean", { default: false })
    approved: boolean

    @CreateDateColumn()
    createdAt: Date
}