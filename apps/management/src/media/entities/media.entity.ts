import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("media_file")
export class MediaFile {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("uuid")
    accountId: string

    @Column()
    name: string

    @Column("varchar")
    filename: string

    @Column("varchar")
    mimetype: string

    @Column("int")
    fileSize: number

    @Column("varchar")
    s3Key: string

    @Column("varchar")
    description: string

    @Column("varchar", {nullable: true})
    wabaId: string

    @Column("varchar", { nullable: true })
    metaHandle: string

    @Column("varchar", { nullable: true })
    handleFilename: string

    @Column("varchar", { nullable: true })
    uploadSessionId: string

    @UpdateDateColumn()
    updatedAt: Date

    @CreateDateColumn()
    createdAt: Date
}