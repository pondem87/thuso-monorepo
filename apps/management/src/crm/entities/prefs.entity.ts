import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Customer } from "./customer.entity";

@Entity("customer_preferences")
export class Preferences {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("boolean", { default: true })
    emailPromo: boolean

    @Column("boolean", { default: true })
    emailUpdates: boolean

    @Column("boolean", { default: true })
    whatsAppPromo: boolean

    @Column("boolean", { default: true })
    whatsAppUpdates: boolean

    @OneToOne(() => Customer, (customer) => customer.prefs)
    @JoinColumn()
    customer: Customer
}