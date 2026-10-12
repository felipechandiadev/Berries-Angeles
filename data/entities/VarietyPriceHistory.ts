import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Currency } from './Variety';

export enum VarietyPriceHistorySource {
  SINGLE = 'SINGLE',
  BULK = 'BULK',
  QUALITY_CREATED = 'QUALITY_CREATED',
  VARIETY_CREATED = 'VARIETY_CREATED',
}

@Entity('variety_price_history')
export class VarietyPriceHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Index()
  @Column({ type: 'int' })
  varietyId!: number;

  @Index()
  @Column({ type: 'int' })
  qualityId!: number;

  @Column({ type: 'varchar', length: 255 })
  qualityName!: string;

  @Column({ type: 'int', default: 0 })
  priceCLP!: number;

  @Column({ type: 'float', default: 0 })
  priceUSD!: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.CLP,
  })
  currency!: Currency;

  @Column({
    type: 'enum',
    enum: VarietyPriceHistorySource,
  })
  source!: VarietyPriceHistorySource;

  @Column({ type: 'varchar', length: 36, nullable: true })
  changedByUserId?: string | null;

  @CreateDateColumn()
  changedAt!: Date;
}
