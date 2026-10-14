'use client';

import { useEffect, useMemo, useState } from 'react';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import { Button } from '@/app/baseComponents/Button/Button';
import { TextField } from '@/app/baseComponents/TextField/TextField';

export type DispatchPalletDraft = {
  key: string;
  emptyWeightKg: string;
  traysQuantity: string;
  grossWeightKg: string;
};

interface AddEditDispatchPalletDialogProps {
  open: boolean;
  onClose: () => void;
  unitTrayWeight: number;
  /** Nombre del tipo de bandeja seleccionado (para el desglose). */
  trayLabel?: string;
  initial?: DispatchPalletDraft | null;
  onSave: (pallet: DispatchPalletDraft) => void;
}

const kgFmt = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

function parseNonNegative(value: string): number | null {
  const n = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function parsePositiveInt(value: string): number | null {
  const n = Math.floor(Number(String(value).replace(',', '.')));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function newKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AddEditDispatchPalletDialog({
  open,
  onClose,
  unitTrayWeight,
  trayLabel,
  initial,
  onSave,
}: AddEditDispatchPalletDialogProps) {
  const isEdit = Boolean(initial?.key);
  const [emptyWeightKg, setEmptyWeightKg] = useState('');
  const [traysQuantity, setTraysQuantity] = useState('');
  const [grossWeightKg, setGrossWeightKg] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmptyWeightKg(initial?.emptyWeightKg ?? '');
    setTraysQuantity(initial?.traysQuantity ?? '');
    setGrossWeightKg(initial?.grossWeightKg ?? '');
    setError(null);
  }, [open, initial]);

  const preview = useMemo(() => {
    const empty = parseNonNegative(emptyWeightKg);
    const trays = parsePositiveInt(traysQuantity);
    const gross = parseNonNegative(grossWeightKg);
    const traysKg =
      trays === null || unitTrayWeight <= 0
        ? null
        : Number((trays * unitTrayWeight).toFixed(3));
    const minGrossKg =
      empty === null || traysKg === null
        ? null
        : Number((empty + traysKg).toFixed(3));

    if (
      empty === null ||
      trays === null ||
      traysKg === null ||
      minGrossKg === null ||
      gross === null ||
      gross <= 0
    ) {
      return {
        empty,
        trays,
        traysKg,
        minGrossKg,
        fruitKg: null as number | null,
        grossTooLow: false,
        valid: false,
      };
    }

    const fruitKg = Number((gross - empty - traysKg).toFixed(3));
    const grossTooLow = gross + 0.001 < minGrossKg;
    return {
      empty,
      trays,
      traysKg,
      minGrossKg,
      fruitKg,
      grossTooLow,
      valid: !grossTooLow && fruitKg >= -0.001,
    };
  }, [emptyWeightKg, traysQuantity, grossWeightKg, unitTrayWeight]);

  const handleSave = () => {
    const empty = parseNonNegative(emptyWeightKg);
    const trays = parsePositiveInt(traysQuantity);
    const gross = parseNonNegative(grossWeightKg);

    if (unitTrayWeight <= 0) {
      setError('Selecciona un tipo de bandeja con peso válido antes de agregar el pallet.');
      return;
    }
    if (empty === null) {
      setError('Ingresa un peso de pallet válido (≥ 0).');
      return;
    }
    if (trays === null) {
      setError('Ingresa una cantidad de bandejas válida (> 0).');
      return;
    }
    if (gross === null || gross <= 0) {
      setError('Ingresa un peso bruto válido (> 0).');
      return;
    }

    const traysKg = Number((trays * unitTrayWeight).toFixed(3));
    const minGrossKg = Number((empty + traysKg).toFixed(3));
    if (gross + 0.001 < minGrossKg) {
      setError(
        `El peso bruto (${kgFmt.format(gross)} kg) no puede ser menor que peso pallet + bandejas (${kgFmt.format(minGrossKg)} kg).`,
      );
      return;
    }

    onSave({
      key: initial?.key ?? newKey(),
      emptyWeightKg: String(empty),
      traysQuantity: String(trays),
      grossWeightKg: String(gross),
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar pallet' : 'Agregar pallet'}
      size="md"
      data-test-id="dispatch-pallet-dialog"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextField
            label="Peso pallet (kg)"
            type="number"
            selectOnFocus
            value={emptyWeightKg}
            onChange={(e) => setEmptyWeightKg(e.target.value)}
          />
          <TextField
            label="Cantidad bandejas"
            type="number"
            selectOnFocus
            value={traysQuantity}
            onChange={(e) => setTraysQuantity(e.target.value)}
          />
          <TextField
            label="Peso bruto (kg)"
            type="number"
            selectOnFocus
            value={grossWeightKg}
            onChange={(e) => setGrossWeightKg(e.target.value)}
          />
        </div>

        <div
          className="space-y-2 rounded-md border border-border bg-muted/20 px-3 py-2.5 text-sm"
          data-test-id="dispatch-pallet-calc-preview"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-secondary">
            Desglose del cálculo
          </div>
          <dl className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <div className="flex justify-between gap-2 sm:col-span-2">
              <dt className="text-secondary">
                Peso unitario bandeja
                {trayLabel ? ` (${trayLabel})` : ''}
              </dt>
              <dd className="font-medium text-foreground">
                {unitTrayWeight > 0 ? `${kgFmt.format(unitTrayWeight)} kg` : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-2 sm:col-span-2">
              <dt className="text-secondary">Bandejas × peso unitario</dt>
              <dd className="font-medium text-foreground">
                {preview.trays == null || unitTrayWeight <= 0
                  ? '—'
                  : `${preview.trays} × ${kgFmt.format(unitTrayWeight)} = ${kgFmt.format(preview.traysKg ?? 0)} kg`}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-secondary">Peso pallet</dt>
              <dd className="font-medium text-foreground">
                {preview.empty == null ? '—' : `${kgFmt.format(preview.empty)} kg`}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-secondary">Peso bruto</dt>
              <dd
                className={`font-medium ${
                  preview.grossTooLow ? 'text-destructive' : 'text-foreground'
                }`}
              >
                {parseNonNegative(grossWeightKg) == null || Number(grossWeightKg) <= 0
                  ? '—'
                  : `${kgFmt.format(Number(String(grossWeightKg).replace(',', '.')))} kg`}
              </dd>
            </div>
            <div className="flex justify-between gap-2 sm:col-span-2">
              <dt className="text-secondary">Mínimo bruto (pallet + bandejas)</dt>
              <dd className="font-medium text-foreground">
                {preview.minGrossKg == null
                  ? '—'
                  : `${kgFmt.format(preview.minGrossKg)} kg`}
              </dd>
            </div>
            <div className="flex justify-between gap-2 sm:col-span-2 border-t border-border pt-1.5">
              <dt className="text-secondary">
                Fruta neta{' '}
                <span className="text-[11px]">(bruto − pallet − bandejas)</span>
              </dt>
              <dd
                className={`font-semibold ${
                  preview.fruitKg != null && preview.fruitKg < 0
                    ? 'text-destructive'
                    : 'text-foreground'
                }`}
              >
                {preview.fruitKg == null ? '—' : `${kgFmt.format(preview.fruitKg)} kg`}
              </dd>
            </div>
          </dl>
          {preview.grossTooLow ? (
            <p className="text-xs text-destructive" data-test-id="dispatch-pallet-gross-too-low">
              El peso bruto no puede ser menor que la suma de peso pallet + bandejas
              {preview.minGrossKg != null
                ? ` (mínimo ${kgFmt.format(preview.minGrossKg)} kg)`
                : ''}
              .
            </p>
          ) : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outlined" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={handleSave}
            disabled={preview.grossTooLow}
          >
            {isEdit ? 'Guardar' : 'Agregar'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
