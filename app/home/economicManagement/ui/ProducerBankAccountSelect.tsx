'use client';

import { useState } from 'react';
import {
  AccountTypeName,
  BankName,
  type PersonBankAccount,
} from '@/data/entities/Person';
import { addProducerBankAccount } from '@/app/actions/advances';
import Select, { type SelectOption } from '@/app/baseComponents/Select/Select';
import { TextField } from '@/app/baseComponents/TextField/TextField';
import { Button } from '@/app/baseComponents/Button/Button';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import Alert from '@/app/baseComponents/Alert/Alert';
import { useAlert } from '@/app/state/contexts/AlertContext';

type AccountOption = { id: string; label: string };

interface ProducerBankAccountSelectProps {
  producerId?: string;
  value: string;
  options: AccountOption[];
  loading?: boolean;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  'data-test-id'?: string;
  onChange: (accountId: string) => void;
  onAccountsUpdated: (accounts: AccountOption[], selectedId: string) => void;
}

const emptyForm = (): PersonBankAccount => ({
  accountType: AccountTypeName.CUENTA_CORRIENTE,
  bank: BankName.BANCO_ESTADO,
  accountNumber: '',
  alias: '',
  isPrimary: false,
});

export default function ProducerBankAccountSelect({
  producerId,
  value,
  options,
  loading = false,
  required = false,
  label = 'Cuenta Productor',
  disabled = false,
  'data-test-id': dataTestId,
  onChange,
  onAccountsUpdated,
}: ProducerBankAccountSelectProps) {
  const { showAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PersonBankAccount>(emptyForm);

  const canAdd = Boolean(producerId) && !disabled && !loading;

  const handleOpen = () => {
    if (!canAdd) return;
    setFormData({
      ...emptyForm(),
      isPrimary: options.length === 0,
    });
    setError(null);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!producerId) {
      setError('Debe seleccionar un productor');
      return;
    }
    if (!formData.accountNumber.trim()) {
      setError('El número de cuenta es requerido');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await addProducerBankAccount(producerId, formData);
      if (!result.success || !result.data) {
        setError(result.error || 'Error al guardar la cuenta');
        return;
      }

      onAccountsUpdated(result.data.accounts, result.data.selectedId);
      showAlert({
        message: result.message || 'Cuenta agregada',
        type: 'success',
        duration: 3000,
      });
      setOpen(false);
    } catch {
      setError('Error inesperado al guardar la cuenta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Select
            label={loading ? 'Cuentas del productor (cargando...)' : label}
            value={value}
            onChange={(val) => onChange(String(val ?? ''))}
            options={options as SelectOption[]}
            required={required}
            disabled={disabled || loading || !producerId}
            data-test-id={dataTestId}
          />
        </div>
        <IconButton
          icon="add"
          variant="outlined"
          ariaLabel="Agregar cuenta del productor"
          onClick={handleOpen}
          disabled={!canAdd}
          data-test-id={dataTestId ? `${dataTestId}-add` : 'producer-account-add'}
        />
      </div>

      <Dialog
        open={open}
        onClose={() => !saving && setOpen(false)}
        title="Nueva Cuenta Bancaria"
        size="md"
      >
        <div className="space-y-4 py-2">
          {error ? <Alert variant="error">{error}</Alert> : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Banco"
              value={formData.bank}
              onChange={(val: string | number | null) =>
                setFormData({ ...formData, bank: val as BankName })
              }
              options={Object.values(BankName).map((bank) => ({ label: bank, id: bank }))}
              required
            />
            <Select
              label="Tipo de Cuenta"
              value={formData.accountType}
              onChange={(val: string | number | null) =>
                setFormData({ ...formData, accountType: val as AccountTypeName })
              }
              options={Object.values(AccountTypeName).map((type) => ({ label: type, id: type }))}
              required
            />
          </div>

          <TextField
            label="Número de Cuenta"
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            placeholder="Ej: 123456789"
            required
          />

          <TextField
            label="Alias (Opcional)"
            value={formData.alias || ''}
            onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
            placeholder="Ej: Cuenta Personal, Empresa, etc."
          />

          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
            <input
              type="checkbox"
              id="producer-account-is-primary"
              checked={Boolean(formData.isPrimary)}
              onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label
              htmlFor="producer-account-is-primary"
              className="cursor-pointer text-sm font-medium text-foreground"
            >
              Marcar como cuenta principal para pagos
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => void handleSave()} loading={saving}>
              Guardar Cuenta
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
