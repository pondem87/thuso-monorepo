import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { ChatMessage } from "./chat-message.entity";
import { ChatTopic } from "./chat-topic.entity";

@Entity()
@Unique(["userId", "phoneNumberId"])
export class ChatHistory {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("uuid", { nullable: true })
    crmId?: string
    
    @Column("varchar")
    userId: string

    @Column("varchar")
    phoneNumberId: string

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