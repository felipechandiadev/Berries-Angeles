'use client';

import { useEffect, useState } from 'react';
import {
  AccountTypeName,
  BankName,
  type PersonBankAccount,
} from '@/data/entities/Person';
import { updatePersonBankAccounts } from '@/app/actions/persons';
import { Button } from '@/app/baseComponents/Button/Button';
import { TextField } from '@/app/baseComponents/TextField/TextField';
import Select from '@/app/baseComponents/Select/Select';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import Alert from '@/app/baseComponents/Alert/Alert';
import { CheckCircle2, CreditCard, Landmark } from 'lucide-react';
import type { SectionProps } from '../producer-detail.types';

export function BankAccountsSection({ data, onRefresh }: SectionProps) {
  const person = data.producer.person;
  const [bankAccounts, setBankAccounts] = useState<PersonBankAccount[]>(
    person?.bankAccounts || [],
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PersonBankAccount>({
    accountType: AccountTypeName.CUENTA_CORRIENTE,
    bank: BankName.BANCO_ESTADO,
    accountNumber: '',
    alias: '',
    isPrimary: false,
  });

  useEffect(() => {
    setBankAccounts(person?.bankAccounts || []);
  }, [person?.bankAccounts]);

  const handleOpenDialog = (index: number | null = null) => {
    if (index !== null) {
      setFormData({ ...bankAccounts[index] });
      setEditingIndex(index);
    } else {
      setFormData({
        accountType: AccountTypeName.CUENTA_CORRIENTE,
        bank: BankName.BANCO_ESTADO,
        accountNumber: '',
        alias: '',
        isPrimary: bankAccounts.length === 0,
      });
      setEditingIndex(null);
    }
    setIsDialogOpen(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!person?.id) return;
    if (!formData.accountNumber.trim()) {
      setError('El número de cuenta es requerido');
      return;
    }

    setLoading(true);
    try {
      let newAccounts = [...bankAccounts];
      if (formData.isPrimary) {
        newAccounts = newAccounts.map((acc) => ({ ...acc, isPrimary: false }));
      }

      if (editingIndex !== null) {
        newAccounts[editingIndex] = formData;
      } else {
        newAccounts.push(formData);
      }

      const result = await updatePersonBankAccounts(person.id, newAccounts);
      if (result.success) {
        setBankAccounts(newAccounts);
        setIsDialogOpen(false);
        onRefresh?.();
      } else {
        setError(result.error || 'Error al guardar');
      }
    } catch {
      setError('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (!person?.id) return;
    if (!confirm('¿Está seguro de eliminar esta cuenta bancaria?')) return;

    setLoading(true);
    try {
      const newAccounts = bankAccounts.filter((_, i) => i !== index);
      if (bankAccounts[index].isPrimary && newAccounts.length > 0) {
        newAccounts[0].isPrimary = true;
      }

      const result = await updatePersonBankAccounts(person.id, newAccounts);
      if (result.success) {
        setBankAccounts(newAccounts);
        onRefresh?.();
      } else {
        alert(result.error || 'Error al eliminar');
      }
    } catch {
      alert('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  if (!person) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
        <Landmark size={48} className="mb-4 opacity-20" />
        <p>No se encontró información de la persona asociada al productor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-test-id="producer-detail-bank-accounts">
      <div className="mb-4 flex items-center gap-2">
        <IconButton
          icon="add"
          variant="outlined"
          ariaLabel="Agregar cuenta"
          onClick={() => handleOpenDialog()}
        />
      </div>

      {bankAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 text-center">
          <div className="mb-4 rounded-full bg-background p-4 shadow-sm">
            <CreditCard size={32} className="text-muted-foreground" />
          </div>
          <h4 className="mb-1 font-medium text-foreground">Sin cuentas registradas</h4>
          <p className="max-w-xs text-sm text-muted-foreground">
            Aún no has agregado ninguna cuenta bancaria para este productor.
          </p>
        </div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
          {bankAccounts.map((account, index) => (
            <article
              key={`${account.accountNumber}-${index}`}
              className={`flex flex-col justify-between rounded-lg border border-border p-4 shadow-sm ${
                account.isPrimary ? 'bg-primary/5' : 'bg-background'
              }`}
            >
              <div className="mb-2 flex w-full flex-col gap-2 overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div
                      className={`rounded-lg p-2 ${
                        account.isPrimary
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Landmark size={18} />
                    </div>
                    <h3 className="truncate text-lg font-semibold text-foreground">
                      {account.alias || account.bank}
                    </h3>
                  </div>
                  {account.isPrimary ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                      <CheckCircle2 size={10} />
                      Principal
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Banco:</span>
                    <span className="text-sm font-medium text-foreground">{account.bank}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Tipo:</span>
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                      {account.accountType}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">N° Cuenta:</span>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {account.accountNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <IconButton
                  icon="edit"
                  variant="basicSecondary"
                  onClick={() => handleOpenDialog(index)}
                  ariaLabel="Editar"
                />
                <IconButton
                  icon="delete"
                  variant="basicSecondary"
                  onClick={() => handleDelete(index)}
                  ariaLabel="Eliminar"
                  disabled={loading}
                />
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingIndex !== null ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
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
              id="isPrimary"
              checked={Boolean(formData.isPrimary)}
              onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="isPrimary" className="cursor-pointer text-sm font-medium text-foreground">
              Marcar como cuenta principal para pagos
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} loading={loading}>
              {editingIndex !== null ? 'Actualizar' : 'Guardar Cuenta'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
