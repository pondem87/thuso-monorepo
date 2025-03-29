import { Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { ChatHistory } from "./chat-history.entity";

@Entity()
export class ChatTopic {
    @PrimaryColumn("date")
    date: string

    @PrimaryColumn("varchar")
    label: string

    @ManyToOne(() => ChatHistory, (chatHistory) => chatHistory.topics)
    chatHistory: ChatHistory
}