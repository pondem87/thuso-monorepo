import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CustomerActionType } from "../types";
import { Customer } from "./customer.entity";

@Entity("customer_action")
export class CustomerAction {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("date")
    date: string

    @Column({ type: "enum", enum: CustomerActionType })
    actionType: CustomerActionType

    @Column("varchar")
    description: string

    @Column("varchar", { nullable: true })
    context?: string

    @CreateDateColumn()
    createdAt: Date

    @ManyToOne(() => Customer, (customer) => customer.actions)
    customer: Customer
}