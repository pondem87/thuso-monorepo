import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("product")
export class Product {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("uuid")
    accountId: string

    @Column("uuid")
    businessProfileId: string

    @Column("varchar")
    name: string

    @Column("varchar")
    shortDescription: string

    @Column("varchar")
    fullDetails: string

    @Column("varchar")
    price: string

    @Column("varchar")
    mimetype: string

    @Column("varchar")
    s3key: string

    @Column("int", { default: 0 })
    views: number

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}