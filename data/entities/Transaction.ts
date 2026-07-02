import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Season } from './Season';
import { Producer } from './Producer';
import { Customer } from './Customer';
import { User } from './User';

export enum TransactionType {
  TRAY_ADJUSTMENT = 'TRAY_ADJUSTMENT',
  TRAY_IN_FROM_PRODUCER = 'TRAY_IN_FROM_PRODUCER',
  TRAY_OUT_TO_PRODUCER = 'TRAY_OUT_TO_PRODUCER',
  TRAY_OUT_TO_CLIENT = 'TRAY_OUT_TO_CLIENT',
  TRAY_IN_FROM_CLIENT = 'TRAY_IN_FROM_CLIENT',
  TRAY_RECEPTION_FROM_PRODUCER = 'TRAY_RECEPTION_FROM_PRODUCER',
  TRAY_RECEPTION_FROM_CLIENT = 'TRAY_RECEPTION_FROM_CLIENT',
  TRAY_DELIVERY_TO_PRODUCER = 'TRAY_DELIVERY_TO_PRODUCER',
  TRAY_DELIVERY_TO_CLIENT = 'TRAY_DELIVERY_TO_CLIENT',
  RECEPTION = 'RECEPTION',
  PALLET_TRAY_ASSIGNMENT = 'PALLET_TRAY_ASSIGNMENT',
  PALLET_TRAY_RELEASE = 'PALLET_TRAY_RELEASE',
  ADVANCE = 'ADVANCE',
}

export enum TransactionDirection {
  IN = 'IN',
  OUT = 'OUT',
}

export enum TransactionUnit {
  TRAY = 'TRAY',
  PALLET = 'PALLET',
  KG = 'KG',
  CLP = 'CLP',
  USD = 'USD',
}

// Templates de metadata para cada tipo de transacción
export interface TrayAdjustmentMetadata {
  reason: string; // Motivo del ajuste
  previousStock?: number;
  newStock?: number;
  storageId?: string; // ID del almacenamiento afectado
  trayId?: string; // ID de la bandeja afectada
  receptionTransactionId?: string;
  receptionPackId?: string | number;
  packNumber?: number;
  notes?: string;
  operation?: string;
  revertedTransactionId?: string | number;
  performedBy?: string;
  performedByName?: string;
  performedAt?: string;
  handlingMode?: 'adjustment' | 'return';
}

export interface TrayMovementMetadata {
  trayId: string; // ID de la bandeja
  quantity: number; // Cantidad movida
  storageFromId?: string; // Almacén de origen
  storageToId?: string; // Almacén de destino
  palletId?: number; // ID del pallet si aplica
  qualityNotes?: string; // Notas de calidad
  temperature?: number; // Temperatura al momento del movimiento
  stockBefore?: number; // Stock de bandejas antes del movimiento
  stockAfter?: number; // Stock de bandejas después del movimiento
  palletTraysBefore?: number; // Total de bandejas en el pallet antes de la asignación
  palletTraysAfter?: number; // Total de bandejas en el pallet después de la asignación
  receptionTransactionId?: string;
  receptionPackId?: string | number;
  packNumber?: number;
  reason?: string;
  notes?: string;
  performedBy?: string;
  performedByName?: string;
  performedAt?: string;
  handlingMode?: 'adjustment' | 'return';
  revertedTransactionId?: string | number;
  counterpartyType?: 'producer' | 'client';
  counterpartyId?: string;
  counterpartyName?: string;
}

export interface TrayDeliveryMetadata extends TrayMovementMetadata {
  deliveryNote?: string; // Número de nota de entrega
  expectedReturnDate?: string | Date; // Fecha esperada de retorno
  transportCompany?: string; // Empresa de transporte
  driverName?: string; // Nombre del conductor
  vehiclePlate?: string; // Placa del vehículo
}

export interface TrayReceptionMetadata extends TrayMovementMetadata {
  receptionNote?: string; // Número de nota de recepción
  supplierBatch?: string; // Lote del proveedor
  qualityCheckPassed: boolean; // Si pasó control de calidad
  qualityIssues?: string[]; // Problemas de calidad encontrados
  weightVerified?: number; // Peso verificado
}


export interface AdvanceMetadata {
  paymentMethod: 'CASH' | 'TRANSFER' | 'CHECK';
  paymentDetails: {
    producerAccountId?: string; // FK a producer bank accounts (future)
    bankAccountId?: string;     // FK a AdminBankAccount.id (origen)
    transactionId?: string;     // ID de transacción bancaria
    checkNumber?: string;       // Número de serie del cheque
  };
  notes?: string;
}

// Union type para metadata según tipo de transacción
export type TransactionMetadata =
  | TrayAdjustmentMetadata
  | TrayMovementMetadata
  | TrayDeliveryMetadata
  | TrayReceptionMetadata
  | AdvanceMetadata;

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: bigint;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type!: TransactionType;

  @ManyToOne(() => Season, { nullable: true })
  @JoinColumn({ name: 'seasonId' })
  season?: Season;

  @Column({ type: 'varchar', nullable: true })
  seasonId?: string;

  @ManyToOne(() => Producer, { nullable: true })
  @JoinColumn({ name: 'producerId' })
  producer?: Producer;

  @Column({ type: 'varchar', nullable: true })
  producerId?: string;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'clientId' })
  client?: Customer;

  @Column({ type: 'varchar', nullable: true })
  clientId?: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', nullable: false })
  userId!: string;

  @Column({
    type: 'enum',
    enum: TransactionDirection,
  })
  direction!: TransactionDirection;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: TransactionUnit,
  })
  unit!: TransactionUnit;

  @Column({ type: 'json', nullable: true })
  metadata?: TransactionMetadata;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}