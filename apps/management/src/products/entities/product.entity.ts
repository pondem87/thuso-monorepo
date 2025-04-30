import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ProductMedia } from "./product-media.entity";

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

    @OneToMany(() => ProductMedia, (media) => media.product)
    media: ProductMedia[]

    @Column("int", { default: 0 })
    views: number

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}