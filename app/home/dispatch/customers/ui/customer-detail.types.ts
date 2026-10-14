import type { PersonBankAccount } from '@/data/entities/Person';
import type { TransactionDirection } from '@/data/entities/Transaction';

export type CustomerDetailSectionId = 'resumen' | 'despachos' | 'bandejas' | 'cuentas';

export type CustomerDetailTabItem = {
  id: CustomerDetailSectionId;
  label: string;
};

export const CUSTOMER_DETAIL_TABS: CustomerDetailTabItem[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'despachos', label: 'Despachos' },
  { id: 'bandejas', label: 'Bandejas' },
  { id: 'cuentas', label: 'Cuentas Bancarias' },
];

export interface CustomerDetailPerson {
  id: string;
  name: string;
  dni: string;
  phone?: string;
  mail?: string;
  bankAccounts?: PersonBankAccount[] | null;
}

export interface CustomerDetailCustomer {
  id: string;
  personId: string;
  name: string;
  dni: string;
  phone?: string;
  mail?: string;
  person?: CustomerDetailPerson | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CustomerDispatchRow {
  id: string;
  createdAt: string | Date;
  trayName: string;
  fruitKgTotal: number;
  traysTotal: number;
  palletsCount: number;
  saleTotalCLP: number;
  pricePerKgCLP: number;
}

export interface TrayMovementRow {
  id: string;
  type: string;
  direction: TransactionDirection | string;
  amount: number;
  createdAt: string | Date;
  metadata?: Record<string, unknown>;
}

export interface CustomerDetailData {
  customer: CustomerDetailCustomer;
  dispatches: CustomerDispatchRow[];
  trays: {
    balance: Record<string, number>;
    movements: TrayMovementRow[];
  };
}

export interface CustomerSectionProps {
  data: CustomerDetailData;
  onRefresh?: () => void;
}
