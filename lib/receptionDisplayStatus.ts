import {
  isPaidOnReception,
  type ReceptionPaymentStatus,
} from '@/lib/receptionPayment';
import {
  normalizeReceptionSettlementStatus,
  type ReceptionSettlementStatus,
} from '@/lib/receptionSettlement';

/** Estado único de recepción para UI / reportes. */
export type ReceptionDisplayStatus =
  | 'PAID'
  | 'SETTLED'
  | 'SETTLED_DRAFT'
  | 'PENDING';

/**
 * Prioridad: Pagada → Liquidada → Liq. borrador → Pendiente.
 * Liquidada implica pagada vía liquidación completa.
 */
export function resolveReceptionDisplayStatus(
  paymentStatus: ReceptionPaymentStatus | unknown,
  settlementStatus: ReceptionSettlementStatus | unknown,
): ReceptionDisplayStatus {
  if (isPaidOnReception(paymentStatus)) {
    return 'PAID';
  }
  const settlement = normalizeReceptionSettlementStatus(settlementStatus);
  if (settlement === 'COMPLETA') {
    return 'SETTLED';
  }
  if (settlement === 'BORRADOR') {
    return 'SETTLED_DRAFT';
  }
  return 'PENDING';
}

export function receptionDisplayStatusLabel(
  status: ReceptionDisplayStatus | unknown,
): string {
  switch (status) {
    case 'PAID':
      return 'Pagada';
    case 'SETTLED':
      return 'Liquidada';
    case 'SETTLED_DRAFT':
      return 'Liq. borrador';
    default:
      return 'Pendiente';
  }
}

export function receptionDisplayStatusFromSources(
  paymentStatus: ReceptionPaymentStatus | unknown,
  settlementStatus: ReceptionSettlementStatus | unknown,
): { status: ReceptionDisplayStatus; label: string } {
  const status = resolveReceptionDisplayStatus(paymentStatus, settlementStatus);
  return { status, label: receptionDisplayStatusLabel(status) };
}
