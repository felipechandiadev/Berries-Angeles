'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/app/baseComponents/Button/Button';
import Select from '@/app/baseComponents/Select/Select';
import { TextField } from '@/app/baseComponents/TextField/TextField';
import { getAppConfigSettings } from '@/app/actions/appConfigSettings';
import { getActiveAdminBankAccounts } from '@/app/actions/adminBankAccounts';
import { getProducerBankAccounts } from '@/app/actions/advances';
import type { PaymentDetails, PaymentMethod } from '@/lib/paymentDetails';
import { useAlert } from '@/app/state/contexts/AlertContext';
import ProducerBankAccountSelect from '@/app/home/economicManagement/ui/ProducerBankAccountSelect';

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

type SelectOption = { id: string; label: string };

const paymentMethodOptions: SelectOption[] = [
  { id: 'CASH', label: 'Efectivo' },
  { id: 'TRANSFER', label: 'Transferencia' },
  { id: 'CHECK', label: 'Cheque' },
];

function formatAdminAccountLabel(account: {
  bank: string;
  accountType: string;
  accountNumber: string;
  alias?: string | null;
}): string {
  const base = `${account.bank} - ${account.accountType} - ${account.accountNumber}`;
  return account.alias ? `${base} (${account.alias})` : base;
}

export type SettlementPaymentState = {
  paymentMethod: PaymentMethod;
  bankAccountId: string;
  producerAccountId: string;
  checkNumber: string;
  transferReference: string;
};

interface SettlementSummaryProps {
  receptionsCount: number;
  receptionsTotal: number;
  advancesCount: number;
  advancesTotal: number;
  balance: number;
  producerId?: string;
  payment: SettlementPaymentState;
  onPaymentChange: (next: SettlementPaymentState) => void;
  canSave: boolean;
  validationError?: string | null;
  isSubmitting: boolean;
  onSaveDraft: () => void;
  onComplete: () => void;
}

export default function SettlementSummary({
  receptionsCount,
  receptionsTotal,
  advancesCount,
  advancesTotal,
  balance,
  producerId,
  payment,
  onPaymentChange,
  canSave,
  validationError,
  isSubmitting,
  onSaveDraft,
  onComplete,
}: SettlementSummaryProps) {
  const { showAlert } = useAlert();
  const needsPayment = balance > 0;
  const [requireBankAccounts, setRequireBankAccounts] = useState(true);
  const [adminAccounts, setAdminAccounts] = useState<SelectOption[]>([]);
  const [producerAccounts, setProducerAccounts] = useState<SelectOption[]>([]);
  const [loadingProducerAccounts, setLoadingProducerAccounts] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [configResult, adminResult] = await Promise.all([
          getAppConfigSettings(),
          getActiveAdminBankAccounts(),
        ]);
        setRequireBankAccounts(configResult.data?.requireBankAccountsInPayments !== false);
        if (adminResult.success && Array.isArray(adminResult.data)) {
          setAdminAccounts(
            (adminResult.data as any[]).map((account) => ({
              id: account.id,
              label: formatAdminAccountLabel(account),
            })),
          );
        }
      } catch (error) {
        console.error('Error loading settlement payment options', error);
      }
    };
    void load();
  }, []);

  const loadProducerAccounts = useCallback(
    async (id: string) => {
      setProducerAccounts([]);
      if (!id || !requireBankAccounts) return;
      setLoadingProducerAccounts(true);
      try {
        const accounts = await getProducerBankAccounts(id);
        setProducerAccounts(accounts);
      } catch {
        showAlert({
          message: 'No fue posible obtener las cuentas del productor',
          type: 'warning',
          duration: 4000,
        });
      } finally {
        setLoadingProducerAccounts(false);
      }
    },
    [requireBankAccounts, showAlert],
  );

  useEffect(() => {
    if (needsPayment && requireBankAccounts && producerId) {
      void loadProducerAccounts(producerId);
    }
  }, [needsPayment, requireBankAccounts, producerId, loadProducerAccounts]);

  const patchPayment = (patch: Partial<SettlementPaymentState>) => {
    onPaymentChange({ ...payment, ...patch });
  };

  const handleComplete = () => {
    if (needsPayment) {
      if (payment.paymentMethod === 'TRANSFER' && requireBankAccounts) {
        if (!payment.bankAccountId) {
          showAlert({
            message: 'Debe seleccionar la cuenta de la administración',
            type: 'error',
            duration: 4000,
          });
          return;
        }
        if (!payment.producerAccountId) {
          showAlert({
            message: 'Debe seleccionar la cuenta del productor',
            type: 'error',
            duration: 4000,
          });
          return;
        }
      }
      if (payment.paymentMethod === 'CHECK') {
        if (requireBankAccounts && !payment.bankAccountId) {
          showAlert({
            message: 'Debe seleccionar la cuenta emisora del cheque',
            type: 'error',
            duration: 4000,
          });
          return;
        }
        if (!payment.checkNumber.trim()) {
          showAlert({
            message: 'Debe ingresar el número de serie del cheque',
            type: 'error',
            duration: 4000,
          });
          return;
        }
      }
    }
    onComplete();
  };

  const showAccountFields =
    needsPayment &&
    requireBankAccounts &&
    (payment.paymentMethod === 'TRANSFER' || payment.paymentMethod === 'CHECK');

  const paymentDetailsHint = useMemo(() => {
    if (!needsPayment) return null;
    if (!requireBankAccounts && payment.paymentMethod !== 'CASH') {
      return 'Las cuentas bancarias no se exigen según la configuración actual.';
    }
    return null;
  }, [needsPayment, requireBankAccounts, payment.paymentMethod]);

  return (
    <section className="space-y-4" data-test-id="settlement-summary">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-primary">Resumen de liquidación</h2>
        <p className="text-sm text-muted-foreground">
          Revisa los totales, indica cómo se paga el saldo y guarda como borrador o completa.
        </p>
      </div>

      <div className="flex h-full flex-col justify-between rounded-lg border border-border bg-background p-6 shadow-sm">
        <dl className="flex flex-1 flex-col gap-4 text-sm sm:gap-5">
          <div className="rounded-md border border-border/60 bg-muted/20 p-3">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Recepciones seleccionadas
            </dt>
            <dd className="mt-2 flex items-baseline justify-between gap-3">
              <span className="text-xl font-semibold text-foreground">{receptionsCount}</span>
              <span className="text-sm font-medium text-primary">
                {currencyFormatter.format(receptionsTotal)}
              </span>
            </dd>
          </div>

          <div className="rounded-md border border-border/60 bg-muted/20 p-3">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Anticipos seleccionados
            </dt>
            <dd className="mt-2 flex items-baseline justify-between gap-3">
              <span className="text-xl font-semibold text-foreground">{advancesCount}</span>
              <span className="text-sm font-medium text-primary">
                {currencyFormatter.format(advancesTotal)}
              </span>
            </dd>
          </div>

          <div className="rounded-md border border-dashed border-primary/50 bg-primary/5 p-4">
            <dt className="text-xs uppercase tracking-wide text-primary">Saldo a pagar</dt>
            <dd className="mt-2 text-3xl font-semibold text-primary">
              {currencyFormatter.format(balance)}
            </dd>
          </div>
        </dl>

        {needsPayment ? (
          <div className="mt-6 space-y-4 border-t border-border pt-5">
            <h3 className="text-sm font-semibold text-foreground">Forma de pago</h3>
            {paymentDetailsHint ? (
              <p className="text-xs text-muted-foreground">{paymentDetailsHint}</p>
            ) : null}

            <Select
              label="Método de pago"
              value={payment.paymentMethod}
              onChange={(val: string | number | null) => {
                const method = (val as PaymentMethod) || 'CASH';
                patchPayment({
                  paymentMethod: method,
                  bankAccountId: method === 'CASH' ? '' : payment.bankAccountId,
                  producerAccountId: method === 'TRANSFER' ? payment.producerAccountId : '',
                  checkNumber: method === 'CHECK' ? payment.checkNumber : '',
                  transferReference: method === 'TRANSFER' ? payment.transferReference : '',
                });
              }}
              options={paymentMethodOptions}
              required
              data-test-id="settlement-payment-method"
            />

            {showAccountFields ? (
              <Select
                label="Cuenta Administración"
                value={payment.bankAccountId}
                onChange={(val) => patchPayment({ bankAccountId: String(val ?? '') })}
                options={adminAccounts}
                required
                data-test-id="settlement-admin-account"
              />
            ) : null}

            {needsPayment && payment.paymentMethod === 'TRANSFER' && requireBankAccounts ? (
              <ProducerBankAccountSelect
                producerId={producerId}
                label="Cuenta Productor"
                value={payment.producerAccountId}
                options={producerAccounts}
                loading={loadingProducerAccounts}
                required
                data-test-id="settlement-producer-account"
                onChange={(accountId) => patchPayment({ producerAccountId: accountId })}
                onAccountsUpdated={(accounts, selectedId) => {
                  setProducerAccounts(accounts);
                  patchPayment({ producerAccountId: selectedId });
                }}
              />
            ) : null}

            {needsPayment && payment.paymentMethod === 'TRANSFER' ? (
              <TextField
                label="Referencia de Transferencia"
                value={payment.transferReference}
                onChange={(e) => patchPayment({ transferReference: e.target.value })}
                data-test-id="settlement-transfer-ref"
              />
            ) : null}

            {needsPayment && payment.paymentMethod === 'CHECK' ? (
              <TextField
                label="Número de Cheque"
                value={payment.checkNumber}
                onChange={(e) => patchPayment({ checkNumber: e.target.value })}
                required
                data-test-id="settlement-check-number"
              />
            ) : null}
          </div>
        ) : (
          <p className="mt-6 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
            Sin saldo a pagar: los anticipos cubren el total de las recepciones.
          </p>
        )}

        {validationError && (
          <p className="mt-4 text-sm text-error" role="alert">
            {validationError}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outlined"
            disabled={!canSave || isSubmitting}
            onClick={onSaveDraft}
          >
            Guardar borrador
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!canSave || isSubmitting}
            loading={isSubmitting}
            onClick={handleComplete}
          >
            Completar liquidación
          </Button>
        </div>
      </div>
    </section>
  );
}

export function buildSettlementPaymentDetails(
  payment: SettlementPaymentState,
  balance: number,
): { paymentMethod?: PaymentMethod; paymentDetails?: PaymentDetails } {
  if (balance <= 0) {
    return {};
  }

  const paymentDetails: PaymentDetails = {};
  if (payment.paymentMethod === 'TRANSFER') {
    if (payment.bankAccountId) paymentDetails.bankAccountId = payment.bankAccountId;
    if (payment.producerAccountId) paymentDetails.producerAccountId = payment.producerAccountId;
    if (payment.transferReference.trim()) {
      paymentDetails.transactionId = payment.transferReference.trim();
    }
  }
  if (payment.paymentMethod === 'CHECK') {
    if (payment.bankAccountId) paymentDetails.bankAccountId = payment.bankAccountId;
    if (payment.checkNumber.trim()) paymentDetails.checkNumber = payment.checkNumber.trim();
  }

  return {
    paymentMethod: payment.paymentMethod,
    paymentDetails: Object.keys(paymentDetails).length > 0 ? paymentDetails : undefined,
  };
}
