import { Column, Entity, OneToOne, PrimaryColumn } from "typeorm";
import { ChatHistory } from "./chat-history.entity";

@Entity()
export class CustomerData {
    @PrimaryColumn("uuid")
    id: string

    @Column("varchar")
    fullName: string

    @OneToOne(() => ChatHistory, (chatHistory) => chatHistory.customerData, { onDelete: "CASCADE" })
    chatHistory: ChatHistory
}