import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from "typeorm";

export enum Currency {
    CLP = 'CLP',
    USD = 'USD'
}

@Entity("varieties")
export class Variety {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    name!: string;

    @Column({ type: 'int' })
    priceCLP!: number;

    @Column({ type: 'float' })
    priceUSD!: number;

    @Column({
        type: 'enum',
        enum: Currency,
        default: Currency.CLP
    })
    currency!: Currency;

    @DeleteDateColumn()
    deletedAt?: Date;
}