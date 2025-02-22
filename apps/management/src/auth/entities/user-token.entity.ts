import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class UserToken {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar")
    userId: string

    @Column("text", {unique: true})
    token: string
}