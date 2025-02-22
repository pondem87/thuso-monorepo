import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity("permission")
export class Permission {
    @PrimaryGeneratedColumn("increment")
    id: number

    @ManyToOne(() => User, (user) => user.permissions)
    user: User

    @Column("varchar")
    accountId: string

    @Column("varchar")
    entity: string

    @Column("varchar")
    action: string
}