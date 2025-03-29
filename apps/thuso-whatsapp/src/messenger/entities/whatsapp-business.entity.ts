import { Column, Entity, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { MessengerAccount } from "./account.entity";

@Entity()
export class MessengerWhatsAppBusiness {
    @PrimaryColumn("varchar")
    wabaId: string

    @ManyToOne(() => MessengerAccount, (account) => account.wabas)
    account: MessengerAccount

    @Column("varchar")
    wabaToken: string

    @Column("varchar")
    profileName: string

    @Column("varchar")
    tagLine: string

    @UpdateDateColumn()
    updatedAt: Date
}