import type { SettlementPaymentState } from './SettlementSummary';

export type SettlementWizardSessionState = {
  step: number;
  selectedReceptionIds: string[];
  selectedAdvanceIds: string[];
  payment: SettlementPaymentState;
};

export function wizardSessionKey(
  settlementId: string | undefined | null,
  producerId: string | undefined | null,
): string {
  const settlementPart = settlementId?.trim() || 'new';
  const producerPart = producerId?.trim() || 'none';
  return `settlement-wizard:${settlementPart}:${producerPart}`;
}

export function loadWizardSession(key: string): SettlementWizardSessionState | null {
  if (typeof window === 'undefined' || !key) return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SettlementWizardSessionState>;
    if (!parsed || typeof parsed !== 'object') return null;

    const step = typeof parsed.step === 'number' ? parsed.step : 1;
    const selectedReceptionIds = Array.isArray(parsed.selectedReceptionIds)
      ? parsed.selectedReceptionIds.filter((id): id is string => typeof id === 'string')
      : [];
    const selectedAdvanceIds = Array.isArray(parsed.selectedAdvanceIds)
      ? parsed.selectedAdvanceIds.filter((id): id is string => typeof id === 'string')
      : [];
    const payment = parsed.payment;
    if (!payment || typeof payment !== 'object') return null;

    return {
      step: step >= 1 && step <= 3 ? step : 1,
      selectedReceptionIds,
      selectedAdvanceIds,
      payment: {
        paymentMethod:
          payment.paymentMethod === 'TRANSFER' ||
          payment.paymentMethod === 'CHECK' ||
          payment.paymentMethod === 'CASH'
            ? payment.paymentMethod
            : 'CASH',
        bankAccountId:
          typeof payment.bankAccountId === 'string' ? payment.bankAccountId : '',
        producerAccountId:
          typeof payment.producerAccountId === 'string' ? payment.producerAccountId : '',
        checkNumber: typeof payment.checkNumber === 'string' ? payment.checkNumber : '',
        transferReference:
          typeof payment.transferReference === 'string' ? payment.transferReference : '',
      },
    };
  } catch {
    return null;
  }
}

export function saveWizardSession(key: string, state: SettlementWizardSessionState): void {
  if (typeof window === 'undefined' || !key) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

export function clearWizardSession(key: string): void {
  if (typeof window === 'undefined' || !key) return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
