import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("document")
export class Document {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("uuid")
    accountId: string

    @Column("uuid")
    businessProfileId: string

    @Column("varchar")
    name: string

    @Column("varchar")
    description: string

    @Column("varchar")
    mimetype: string

    @Column("varchar")
    s3key: string

    @Column("boolean")
    embedded: boolean

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}