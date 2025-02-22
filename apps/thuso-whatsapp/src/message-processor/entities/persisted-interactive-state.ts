import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Snapshot } from "xstate";

@Entity()
export class PersistedInteractiveState {
    @PrimaryColumn("varchar")
    phoneNumberId: string
    
    @PrimaryColumn("varchar")
    userId: string

    @Column("simple-json")
    persistedStateMachine?: Snapshot<any>

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}