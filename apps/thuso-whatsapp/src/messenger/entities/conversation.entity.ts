import { BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { SentMessage } from "./sent-message.entity";

@Entity()
export class Conversation {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar")
    phoneNumberId: string

    @Column("varchar")
    userId: string

    @Column("varchar")
    type: string

    @OneToMany(() => SentMessage, (sentMessage) => sentMessage.conversation)
    sentMessages: SentMessage[]

    @Column("timestamp", {nullable: true})
    expiry: Date

    @BeforeInsert()
    setExpiry() {
        this.expiry = new Date(new Date().setHours(new Date().getHours() + 24))
    }

    @CreateDateColumn()
    createdAt: Date
}