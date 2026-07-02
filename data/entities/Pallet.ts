import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Storage } from './Storage';
import { Tray } from './Tray';

export interface PalletTrayAssignment {
    receptionPackId: string;
    trayId: string;
    quantity: number;
}

export type PalletMetadata = PalletTrayAssignment[] | null;

export enum PalletStatus {
    AVAILABLE = 'AVAILABLE',
    CLOSED = 'CLOSED',
    FULL = 'FULL',
    DISPATCHED = 'DISPATCHED'
}

@Entity('pallets')
export class Pallet {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    storageId!: string;

    @Column({ type: 'varchar', length: 255 })
    trayId!: string;

    @Column({ type: 'int', default: 0 })
    traysQuantity!: number;

    @Column({ type: 'int' })
    capacity!: number;

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
    weight!: number;

    @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
    dispatchWeight!: number;

    @Column({ type: 'json', nullable: true })
    metadata?: PalletMetadata;

    @Column({
        type: 'enum',
        enum: PalletStatus,
        default: PalletStatus.AVAILABLE
    })
    status!: PalletStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    @ManyToOne(() => Storage)
    @JoinColumn({ name: 'storageId' })
    storage!: Storage;

    @ManyToOne(() => Tray)
    @JoinColumn({ name: 'trayId' })
    tray!: Tray;
}