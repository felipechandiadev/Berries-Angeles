'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Switch from '@/app/baseComponents/Switch/Switch';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { updateAppConfigSettings } from '@/app/actions/appConfigSettings';

type PaymentBankConfigSectionProps = {
  requireBankAccountsInPayments: boolean;
};

export default function PaymentBankConfigSection({
  requireBankAccountsInPayments: initialValue,
}: PaymentBankConfigSectionProps) {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [requireAccounts, setRequireAccounts] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRequireAccounts(initialValue);
  }, [initialValue]);

  const handleChange = async (checked: boolean) => {
    const previous = requireAccounts;
    setRequireAccounts(checked);
    setSaving(true);
    try {
      const result = await updateAppConfigSettings({
        requireBankAccountsInPayments: checked,
      });
      if (!result.success) {
        setRequireAccounts(previous);
        showAlert({
          message: result.error || 'No se pudo guardar la configuración',
          type: 'error',
          duration: 5000,
        });
        return;
      }
      showAlert({
        message: checked
          ? 'Se exigirán cuentas bancarias en anticipos y liquidaciones'
          : 'No se exigirán cuentas bancarias en anticipos y liquidaciones',
        type: 'success',
        duration: 4000,
      });
      router.refresh();
    } catch {
      setRequireAccounts(previous);
      showAlert({
        message: 'Error inesperado al guardar la configuración',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="mb-6 rounded-lg border border-border bg-background p-4"
      data-test-id="payment-bank-config-section"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-semibold text-foreground">Configuración de pagos</h2>
          <p className="text-sm text-muted-foreground">
            Si está desactivado, en anticipos y liquidaciones por transferencia o cheque no se
            pedirá cuenta de administración ni del productor.
          </p>
        </div>
        <div className="shrink-0">
          <Switch
            label="Exigir cuentas bancarias en pagos"
            labelPosition="left"
            checked={requireAccounts}
            onChange={handleChange}
            disabled={saving}
            data-test-id="require-bank-accounts-switch"
          />
        </div>
      </div>
    </section>
  );
}
