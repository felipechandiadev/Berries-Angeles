import { PalletStatus, type PalletMetadata } from '@/data/entities/Pallet';

export interface PalletRow {
  id: number;
  trayId: string;
  trayName: string | null;
  /** Peso unitario de la bandeja (si viene del join). */
  trayWeight?: number | null;
  traysQuantity: number;
  capacity: number;
  weight: number;
  dispatchWeight: number;
  status: PalletStatus;
  metadata?: PalletMetadata;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
