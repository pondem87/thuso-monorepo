import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Account } from "./account.entity";
import { Permission } from "./permission.entity";
import { OnboardingState } from "@lib/thuso-common";

@Entity("user")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar", { unique: true })
    email: string

    @OneToOne(() => Account, (account) => account.root)
    rootOf: Account

    @ManyToMany(() => Account, (account) => account.users)
    accounts: Account[]

    @OneToMany(() => Permission, (permission) => permission.user)
    permissions: Permission[]

    @Column("varchar")
    forenames: string

    @Column("varchar")
    surname: string

    @Column("varchar")
    passwordHash: string

    @Column({ type: "enum", enum: OnboardingState, nullable: true })
    onboardingState: OnboardingState | null

    @Column("boolean", { default: false })
    verified: boolean

    @Column("varchar", { length: 6,  nullable: true })
    verificationCode: string

    @CreateDateColumn()
    createdAt: Date
}