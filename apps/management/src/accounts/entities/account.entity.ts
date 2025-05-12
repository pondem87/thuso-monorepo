import { BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { Invitation } from "./invitation.entity";

@Entity("account")
export class Account {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar", { unique: true })
    name: string

    @OneToOne(() => User, (user) => user.rootOf)
    @JoinColumn()
    root: User

    @ManyToMany(() => User, (user) => user.accounts)
    @JoinTable()
    users: User[]

    @OneToMany(() => Invitation, (invitation) => invitation.account)
    invitations: Invitation[]

    @Column("int8", { default: 2 })
    maxAllowedBusinesses: number

    @Column("int", { default: 50 })
    maxAllowedDailyConversations: number

    @Column("boolean", { default: false })
    disabled: boolean

    @Column("timestamp", { nullable: true })
    subscriptionEndDate: Date

    @CreateDateColumn()
    createdAt: Date

    // Automatically set subscription end date to 30 days after creation
    @BeforeInsert()
    setSubscriptionEndDate() {
        const now = new Date();
        this.subscriptionEndDate = new Date(now.setMonth(now.getMonth() + 2));
    }
}