export type ReceptionSettlementStatus = 'NONE' | 'BORRADOR' | 'COMPLETA';

export function normalizeReceptionSettlementStatus(
  value: unknown,
): ReceptionSettlementStatus {
  if (value === 'BORRADOR' || value === 'COMPLETA') return value;
  return 'NONE';
}

export function receptionSettlementStatusLabel(
  status: ReceptionSettlementStatus | unknown,
): string {
  switch (normalizeReceptionSettlementStatus(status)) {
    case 'COMPLETA':
      return 'Liquidada';
    case 'BORRADOR':
      return 'Liq. borrador';
    default:
      return 'Sin liquidar';
  }
}

/** True when the reception is linked to any settlement (draft or complete). */
export function isReceptionLinkedToSettlement(
  status: ReceptionSettlementStatus | unknown,
): boolean {
  const normalized = normalizeReceptionSettlementStatus(status);
  return normalized === 'BORRADOR' || normalized === 'COMPLETA';
}
