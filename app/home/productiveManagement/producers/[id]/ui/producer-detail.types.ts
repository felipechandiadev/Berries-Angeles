import type { PersonBankAccount } from '@/data/entities/Person';
import type { AdvanceMetadata, SettlementMetadata, TransactionDirection } from '@/data/entities/Transaction';

export type ProducerDetailSectionId =
  | 'resumen'
  | 'recepciones'
  | 'anticipos'
  | 'liquidaciones'
  | 'bandejas'
  | 'cuentas';

export type ProducerDetailTabItem = {
  id: ProducerDetailSectionId;
  label: string;
};

export const PRODUCER_DETAIL_TABS: ProducerDetailTabItem[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'recepciones', label: 'Recepciones' },
  { id: 'anticipos', label: 'Anticipos' },
  { id: 'liquidaciones', label: 'Liquidaciones' },
  { id: 'bandejas', label: 'Bandejas' },
  { id: 'cuentas', label: 'Cuentas Bancarias' },
];

export function producerDetailSectionFromHash(hash: string): ProducerDetailSectionId | null {
  const id = hash.replace(/^#/, '').trim() as ProducerDetailSectionId;
  return PRODUCER_DETAIL_TABS.some((t) => t.id === id) ? id : null;
}

export interface ProducerDetailPerson {
  id: string;
  name: string;
  dni: string;
  phone?: string;
  mail?: string;
  bankAccounts?: PersonBankAccount[] | null;
}

export interface ProducerDetailProducer {
  id: string;
  name: string;
  dni: string;
  phone?: string;
  mail?: string;
  productiveUnitId: string;
  personId: string;
  productiveUnit?: { id: string; name: string } | null;
  person?: ProducerDetailPerson | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ExtendedReception {
  id: string;
  amount: number;
  createdAt: string | Date;
  variety: string;
  formatName: string;
  price: number;
  netWeight: number;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface ExtendedAdvance {
  id: string;
  amount: number;
  createdAt: string | Date;
  status?: string;
  metadata?: AdvanceMetadata | Record<string, unknown>;
}

export interface ExtendedSettlement {
  id: string;
  amount: number;
  createdAt: string | Date;
  metadata?: SettlementMetadata | Record<string, unknown>;
}

export interface TrayMovementRow {
  id: string;
  type: string;
  direction: TransactionDirection | string;
  amount: number;
  createdAt: string | Date;
  metadata?: Record<string, unknown>;
}

export interface ProducerDetailData {
  producer: ProducerDetailProducer;
  receptions: ExtendedReception[];
  advances: ExtendedAdvance[];
  settlements: ExtendedSettlement[];
  trays: {
    balance: Record<string, number>;
    movements: TrayMovementRow[];
  };
}

export interface SectionProps {
  data: ProducerDetailData;
  onRefresh?: () => void;
}
