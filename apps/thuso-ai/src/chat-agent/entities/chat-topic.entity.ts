import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ChatHistory } from "./chat-history.entity";

@Entity()
export class ChatTopic {
    @PrimaryGeneratedColumn("increment")
    id: number

    @Column("date")
    date: string

    @Column("varchar")
    label: string

    @ManyToOne(() => ChatHistory, (chatHistory) => chatHistory.topics)
    chatHistory: ChatHistory
}