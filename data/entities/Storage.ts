import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

export enum StorageType {
    COLD_ROOM = 'COLD_ROOM',
    IQF_TUNNEL = 'IQF_TUNNEL',
    DRY_WAREHOUSE = 'DRY_WAREHOUSE',
    FREEZER = 'FREEZER'
}

@Entity("storages")
export class Storage {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({
        type: 'enum',
        enum: StorageType
    })
    type!: StorageType;

    @Column({ type: 'int', nullable: true })
    capacityPallets?: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    location?: string;

    @Column({ type: 'boolean', default: true })
    active!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}