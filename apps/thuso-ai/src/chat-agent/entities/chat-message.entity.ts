import { StoredMessage } from "@langchain/core/messages";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ChatHistory } from "./chat-history.entity";


@Entity()
export class ChatMessage {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @ManyToOne(() => ChatHistory, (chatHistory) => chatHistory.messages, {onDelete: "CASCADE"})
    chatHistory: ChatHistory

    @Column("simple-json")
    message: StoredMessage

    @CreateDateColumn()
    createdAt: Date
}