import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity("product_media")
export class ProductMedia {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("uuid")
    accountId: string

    @Column("varchar")
    filename: string

    @Column("varchar")
    mimetype: string
    
    @Column("varchar")
    s3key: string

    @ManyToOne(() => Product, (product) => product.media)
    product: Product
}