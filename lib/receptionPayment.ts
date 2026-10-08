export type ReceptionPaymentStatus = 'PENDING' | 'PAID_ON_RECEPTION';

export function normalizePaymentStatus(value: unknown): ReceptionPaymentStatus {
  if (value === 'PAID_ON_RECEPTION') {
    return 'PAID_ON_RECEPTION';
  }
  return 'PENDING';
}

export function paymentStatusLabel(status: ReceptionPaymentStatus | unknown): string {
  return normalizePaymentStatus(status) === 'PAID_ON_RECEPTION' ? 'Pagada' : 'Pendiente';
}

export function isPaidOnReception(status: ReceptionPaymentStatus | unknown): boolean {
  return normalizePaymentStatus(status) === 'PAID_ON_RECEPTION';
}
