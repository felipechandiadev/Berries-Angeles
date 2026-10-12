import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Singleton row id for application settings. */
export const APP_CONFIG_SINGLETON_ID = '1';

@Entity('app_config')
export class AppConfig {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id!: string;

  /**
   * When true (default), TRANSFER/CHECK advances require admin/producer bank accounts.
   * When false, those account fields are optional and hidden in the payment UI.
   */
  @Column({ type: 'boolean', default: true })
  requireBankAccountsInPayments!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
