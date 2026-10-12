import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from "typeorm";

export enum Currency {
    CLP = 'CLP',
    USD = 'USD'
}

/** Precio de un tipo de calidad (Format) asociado a una variedad. */
export type VarietyQualityPrice = {
    qualityId: number;
    qualityName: string;
    priceCLP: number;
    priceUSD: number;
    currency: Currency;
    /** Espejo de Format.active para esta calidad en la variedad. */
    active: boolean;
};

@Entity("varieties")
export class Variety {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    name!: string;

    @Column({ type: 'json', nullable: false })
    qualityPrices!: VarietyQualityPrice[];

    @DeleteDateColumn()
    deletedAt?: Date;
}
