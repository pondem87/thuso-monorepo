import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Account } from "./account.entity";

@Entity("invitation")
export class Invitation {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar", { nullable: false })
    email: string

    @ManyToOne(() => Account, (account) => account.invitations)
    account: Account

    @CreateDateColumn()
    createdAt: Date
}