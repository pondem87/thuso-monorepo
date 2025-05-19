import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ChatMessage } from "./chat-message.entity";
import { ChatTopic } from "./chat-topic.entity";

@Entity()
export class ChatHistory {
    @PrimaryColumn("varchar")
    userId: string

    @PrimaryColumn("varchar")
    phoneNumberId: string

    @Column("uuid", { nullable: true})
    crmId: string

    @Column("varchar")
    wabaId: string

    @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.chatHistory)
    messages: ChatMessage[]

    @OneToMany(() => ChatTopic, (chatTopic) => chatTopic.chatHistory)
    topics: ChatTopic[]

    @Column("timestamp", { nullable: true })
    lastMessageTime: Date

    @Column("varchar", { nullable: true })
    lastTopic: string

    @UpdateDateColumn()
    updatedAt: Date

    @CreateDateColumn()
    createdAt: Date
}