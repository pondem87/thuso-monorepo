import { Column, CreateDateColumn, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { ChatMessage } from "./chat-message.entity";
import { ChatTopic } from "./chat-topic.entity";
import { CustomerData } from "./customer-data.entity";

@Entity()
@Unique(["userId", "phoneNumberId"])
export class ChatHistory {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @OneToOne(() => CustomerData, (customerData) => customerData.chatHistory)
    @JoinColumn()
    customerData: CustomerData
    
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

    @Column("boolean", { default: false })
    unread: boolean

    @UpdateDateColumn()
    updatedAt: Date

    @CreateDateColumn()
    createdAt: Date
}