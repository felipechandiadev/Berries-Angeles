export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CHECK';

export type PaymentDetails = {
  producerAccountId?: string;
  bankAccountId?: string;
  transactionId?: string;
  checkNumber?: string;
};

export function buildOutboundPaymentDetails(
  paymentMethod: PaymentMethod,
  details: PaymentDetails | undefined,
  options: { requireBankAccountsInPayments: boolean } = { requireBankAccountsInPayments: true },
): PaymentDetails {
  const raw = details ?? {};
  const requireAccounts = options.requireBankAccountsInPayments;

  if (paymentMethod === 'TRANSFER') {
    if (requireAccounts && !raw.bankAccountId) {
      throw new Error('Debe seleccionar la cuenta bancaria de la administración para transferencias.');
    }
    if (requireAccounts && !raw.producerAccountId) {
      throw new Error('Debe seleccionar la cuenta bancaria del productor para transferencias.');
    }
  }

  if (paymentMethod === 'CHECK') {
    if (requireAccounts && !raw.bankAccountId) {
      throw new Error('Debe seleccionar la cuenta bancaria emisora del cheque.');
    }
    if (!raw.checkNumber?.trim()) {
      throw new Error('Debe ingresar el número de serie del cheque.');
    }
  }

  return {
    producerAccountId: raw.producerAccountId,
    bankAccountId: raw.bankAccountId,
    transactionId: raw.transactionId,
    checkNumber: raw.checkNumber,
  };
}

export function paymentMethodLabel(method: PaymentMethod | string | undefined | null): string {
  switch (method) {
    case 'CASH':
      return 'Efectivo';
    case 'TRANSFER':
      return 'Transferencia';
    case 'CHECK':
      return 'Cheque';
    default:
      return '—';
  }
}
