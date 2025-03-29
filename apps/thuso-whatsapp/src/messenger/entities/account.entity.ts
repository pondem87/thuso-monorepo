import { Column, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm"
import { MessengerWhatsAppBusiness } from "./whatsapp-business.entity"

@Entity()
export class MessengerAccount {
    @PrimaryColumn("uuid")
    id: string

    @Column("int")
    maxAllowedDailyConversations: number

    @Column("boolean", { default: false })
    disabled: boolean

    @Column("timestamp", { nullable: true })
    subscriptionEndDate: Date

    @UpdateDateColumn()
    updatedAt: Date

    @OneToMany(() => MessengerWhatsAppBusiness, (waba) => waba.account)
    wabas: MessengerWhatsAppBusiness[]
}