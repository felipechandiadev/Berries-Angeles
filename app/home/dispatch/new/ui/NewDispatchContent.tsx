'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AutoComplete, { type Option } from '@/app/baseComponents/AutoComplete/AutoComplete';
import { Button } from '@/app/baseComponents/Button/Button';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import { TextField } from '@/app/baseComponents/TextField/TextField';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import { createDispatch } from '@/app/actions/dispatches';

type SelectOption = { id: string; label: string };
type TrayOption = { id: string; label: string; weight: number; stock: number };

function optionById(options: SelectOption[], id: string): Option | null {
  if (!id) return null;
  return options.find((o) => o.id === id) ?? null;
}

type PalletCard = {
  key: string;
  emptyWeightKg: string;
  traysQuantity: string;
  grossWeightKg: string;
};

interface NewDispatchContentProps {
  customerOptions: SelectOption[];
  trayOptions: TrayOption[];
  storageOptions: SelectOption[];
}

const kgFmt = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

function newPalletCard(): PalletCard {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    emptyWeightKg: '',
    traysQuantity: '',
    grossWeightKg: '',
  };
}

function parsePositiveNumber(value: string): number | null {
  const n = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function parsePositiveInt(value: string): number | null {
  const n = Math.floor(Number(String(value).replace(',', '.')));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export default function NewDispatchContent({
  customerOptions,
  trayOptions,
  storageOptions,
}: NewDispatchContentProps) {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const { isSubmitting, run } = useSubmitLock();

  const [customerId, setCustomerId] = useState('');
  const [trayId, setTrayId] = useState('');
  const [storageId, setStorageId] = useState('');
  const [notes, setNotes] = useState('');
  const [pallets, setPallets] = useState<PalletCard[]>([newPalletCard()]);

  const selectedTray = useMemo(
    () => trayOptions.find((t) => t.id === trayId) ?? null,
    [trayOptions, trayId],
  );
  const unitTrayWeight = selectedTray?.weight ?? 0;
  const stockAvailable = selectedTray?.stock ?? 0;

  const traySelectOptions = useMemo(
    () =>
      trayOptions.map((t) => ({
        id: t.id,
        label: `${t.label} · stock ${t.stock} · ${kgFmt.format(t.weight)} kg`,
      })),
    [trayOptions],
  );

  const computed = useMemo(() => {
    let traysTotal = 0;
    let fruitKgTotal = 0;
    let grossKgTotal = 0;
    let invalid = false;

    const lines = pallets.map((pallet) => {
      const emptyWeightKg = parsePositiveNumber(pallet.emptyWeightKg);
      const traysQuantity = parsePositiveInt(pallet.traysQuantity);
      const grossWeightKg = parsePositiveNumber(pallet.grossWeightKg);

      if (emptyWeightKg === null || traysQuantity === null || grossWeightKg === null || grossWeightKg <= 0) {
        invalid = true;
        return {
          traysKg: null as number | null,
          fruitKg: null as number | null,
          traysQuantity: 0,
          grossWeightKg: 0,
        };
      }

      const traysKg = traysQuantity * unitTrayWeight;
      const fruitKg = grossWeightKg - emptyWeightKg - traysKg;
      traysTotal += traysQuantity;
      grossKgTotal += grossWeightKg;
      fruitKgTotal += Math.max(0, fruitKg);
      if (fruitKg < -0.001) invalid = true;

      return { traysKg, fruitKg, traysQuantity, grossWeightKg };
    });

    return {
      lines,
      traysTotal,
      fruitKgTotal,
      grossKgTotal,
      invalid,
      stockOk: traysTotal <= stockAvailable,
    };
  }, [pallets, unitTrayWeight, stockAvailable]);

  const canConfirm =
    Boolean(customerId && trayId && storageId && currentUserId) &&
    pallets.length > 0 &&
    !computed.invalid &&
    computed.stockOk &&
    !isSubmitting;

  const updatePallet = (key: string, field: keyof PalletCard, value: string) => {
    setPallets((prev) =>
      prev.map((p) => (p.key === key ? { ...p, [field]: value } : p)),
    );
  };

  const handleConfirm = async () => {
    if (!currentUserId) {
      showAlert({ message: 'Debes iniciar sesión para confirmar el despacho', type: 'error' });
      return;
    }
    if (!canConfirm) {
      showAlert({
        message: !computed.stockOk
          ? `Stock insuficiente: disponibles ${stockAvailable}, requeridas ${computed.traysTotal}`
          : 'Completa cliente, bandeja, almacén y pallets válidos',
        type: 'warning',
      });
      return;
    }

    const result = await run(async () => {
      const payload = {
        customerId,
        trayId,
        storageId,
        userId: currentUserId,
        notes: notes.trim() || undefined,
        pallets: pallets.map((p) => ({
          emptyWeightKg: Number(String(p.emptyWeightKg).replace(',', '.')),
          traysQuantity: Math.floor(Number(String(p.traysQuantity).replace(',', '.'))),
          grossWeightKg: Number(String(p.grossWeightKg).replace(',', '.')),
        })),
      };

      const createResult = await createDispatch(payload);
      if (createResult.success) {
        showAlert({
          message: `Despacho #${createResult.data?.dispatchId} confirmado`,
          type: 'success',
          duration: 4000,
        });
        return { ok: true as const };
      }
      showAlert({
        message: createResult.error || 'Error al crear el despacho',
        type: 'error',
        duration: 5000,
      });
      return { ok: false as const };
    });

    if (result?.ok) {
      router.push('/home/dispatch/dispatches');
      router.refresh();
    }
  };

  return (
    <div className="space-y-4 pb-28" data-test-id="new-dispatch-content">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <AutoComplete
          label="Cliente"
          options={customerOptions}
          value={optionById(customerOptions, customerId)}
          onChange={(opt) => setCustomerId((opt as Option | null)?.id ? String((opt as Option).id) : '')}
          required
        />
        <AutoComplete
          label="Tipo de bandeja"
          options={traySelectOptions}
          value={optionById(traySelectOptions, trayId)}
          onChange={(opt) => setTrayId((opt as Option | null)?.id ? String((opt as Option).id) : '')}
          required
        />
        <AutoComplete
          label="Almacén destino"
          options={storageOptions}
          value={optionById(storageOptions, storageId)}
          onChange={(opt) => setStorageId((opt as Option | null)?.id ? String((opt as Option).id) : '')}
          required
        />
      </div>

      {selectedTray && (
        <p className="text-sm text-secondary">
          Stock disponible: <span className="font-medium text-foreground">{stockAvailable}</span> ·
          Peso unitario: <span className="font-medium text-foreground">{kgFmt.format(unitTrayWeight)} kg</span>
        </p>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Pallets</h3>
          <Button
            variant="outlined"
            type="button"
            onClick={() => setPallets((prev) => [...prev, newPalletCard()])}
          >
            Agregar pallet
          </Button>
        </div>

        {pallets.map((pallet, index) => {
          const line = computed.lines[index];
          return (
            <div
              key={pallet.key}
              className="rounded-lg border border-border bg-muted/20 p-4"
              data-test-id={`dispatch-pallet-card-${index}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Pallet {index + 1}</span>
                {pallets.length > 1 && (
                  <IconButton
                    icon="delete"
                    variant="basicSecondary"
                    size="xs"
                    title="Quitar pallet"
                    ariaLabel="Quitar pallet"
                    onClick={() =>
                      setPallets((prev) => prev.filter((p) => p.key !== pallet.key))
                    }
                  />
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <TextField
                  label="Tara vacía (kg)"
                  type="number"
                  value={pallet.emptyWeightKg}
                  onChange={(e) => updatePallet(pallet.key, 'emptyWeightKg', e.target.value)}
                />
                <TextField
                  label="Cantidad bandejas"
                  type="number"
                  value={pallet.traysQuantity}
                  onChange={(e) => updatePallet(pallet.key, 'traysQuantity', e.target.value)}
                />
                <TextField
                  label="Peso bruto (kg)"
                  type="number"
                  value={pallet.grossWeightKg}
                  onChange={(e) => updatePallet(pallet.key, 'grossWeightKg', e.target.value)}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-secondary">Bandejas kg: </span>
                  <span className="font-medium">
                    {line?.traysKg == null ? '—' : `${kgFmt.format(line.traysKg)} kg`}
                  </span>
                </div>
                <div>
                  <span className="text-secondary">Fruta neta: </span>
                  <span
                    className={`font-medium ${
                      line?.fruitKg != null && line.fruitKg < 0 ? 'text-destructive' : ''
                    }`}
                  >
                    {line?.fruitKg == null ? '—' : `${kgFmt.format(line.fruitKg)} kg`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <TextField
        label="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="sticky bottom-0 z-20 -mx-page border-t border-border bg-background/95 px-page py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-secondary">
            <span className="mr-3">
              Pallets: <span className="font-medium text-foreground">{pallets.length}</span>
            </span>
            <span className="mr-3">
              Bandejas: <span className="font-medium text-foreground">{computed.traysTotal}</span>
              {!computed.stockOk && (
                <span className="ml-1 text-destructive">(stock {stockAvailable})</span>
              )}
            </span>
            <span>
              Fruta: <span className="font-medium text-foreground">{kgFmt.format(computed.fruitKgTotal)} kg</span>
            </span>
          </div>
          <Button
            variant="primary"
            type="button"
            loading={isSubmitting}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            Confirmar despacho
          </Button>
        </div>
      </div>
    </div>
  );
}
