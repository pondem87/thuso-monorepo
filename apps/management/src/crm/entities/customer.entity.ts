import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Preferences } from "./prefs.entity";
import { Gender } from "../types";
import { CustomerAction } from "./action.entity";

@Entity("customer")
export class Customer {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("uuid")
    accountId: string

    @Column("varchar")
    forenames: string

    @Column("varchar")
    surname: string

    @Column("varchar", { nullable: true })
    streetAd: string

    @Column("varchar")
    city: string

    @Column("varchar")
    country: string

    @Column("int", { nullable: true })
    age: number

    @Column({ type: "enum", enum: Gender })
    gender: Gender

    @Column("varchar", { nullable: true })
    email: string

    @Column("varchar")
    whatsAppNumber: string

    @Column("varchar", { nullable: true })
    notes: string

    @OneToOne(() => Preferences, (prefs) => prefs.customer)
    prefs: Preferences

    @OneToMany(() => CustomerAction, (action) => action.customer)
    actions: CustomerAction[]
}