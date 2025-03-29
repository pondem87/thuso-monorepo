import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Conversation } from "./conversation.entity";
import { MessageBody } from "@lib/thuso-common";

@Entity()
export class SentMessage {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar")
    wamid: string

    @Column("simple-json")
    messageBody: MessageBody

    @ManyToOne(() => Conversation, (conversation) => conversation.sentMessages)
    conversation: Conversation
}