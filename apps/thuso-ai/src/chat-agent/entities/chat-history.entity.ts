import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ChatMessage } from "./chat-message.entity";
import { ChatTopic } from "./chat-topic.entity";

@Entity()
export class ChatHistory {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar")
    wabaId: string

    @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.chatHistory)
    messages: ChatMessage[]

    @OneToMany(() => ChatTopic, (chatTopic) => chatTopic.chatHistory)
    topics: ChatTopic

    @PrimaryColumn("varchar")
    userId: string

    @PrimaryColumn("varchar")
    phoneNumberId: string

    @UpdateDateColumn()
    updatedAt: Date

    @CreateDateColumn()
    createdAt: Date
}