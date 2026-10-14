'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AutoComplete, { type Option } from '@/app/baseComponents/AutoComplete/AutoComplete';
import { Button } from '@/app/baseComponents/Button/Button';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import { TextField } from '@/app/baseComponents/TextField/TextField';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { useSubmitLock } from '@/app/state/hooks/useSubmitLock';
import {
  createDispatch,
  type CreateDispatchResult,
} from '@/app/actions/dispatches';
import AddEditDispatchPalletDialog, {
  type DispatchPalletDraft,
} from './AddEditDispatchPalletDialog';
import PrintDispatchDialog from './PrintDispatchDialog';
import PrintDispatchPalletDialog, {
  type DispatchPalletPrintSnapshot,
} from './PrintDispatchPalletDialog';

type SelectOption = { id: string; label: string };
type TrayOption = { id: string; label: string; weight: number; stock: number };

function optionById(options: SelectOption[], id: string): Option | null {
  if (!id) return null;
  return options.find((o) => o.id === id) ?? null;
}

interface NewDispatchContentProps {
  customerOptions: SelectOption[];
  trayOptions: TrayOption[];
}

const kgFmt = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const currencyFmt = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
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

function SummaryCard({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`min-w-[6.5rem] rounded-md border px-2.5 py-1.5 ${
        warn ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-muted/20'
      }`}
    >
      <div className="text-[10px] uppercase tracking-wide text-secondary">{label}</div>
      <div className={`truncate text-sm font-semibold ${warn ? 'text-destructive' : 'text-foreground'}`}>
        {value}
      </div>
    </div>
  );
}

export default function NewDispatchContent({
  customerOptions,
  trayOptions,
}: NewDispatchContentProps) {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const { isSubmitting, run } = useSubmitLock();

  const [customerId, setCustomerId] = useState('');
  const [trayId, setTrayId] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [notes, setNotes] = useState('');
  const [pallets, setPallets] = useState<DispatchPalletDraft[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPallet, setEditingPallet] = useState<DispatchPalletDraft | null>(null);
  const [printSnapshot, setPrintSnapshot] = useState<DispatchPalletPrintSnapshot | null>(null);
  const [dispatchPrint, setDispatchPrint] = useState<CreateDispatchResult | null>(null);

  // Tras un seed, los UUID de bandejas/clientes cambian: limpiar selección obsoleta.
  useEffect(() => {
    if (trayId && !trayOptions.some((t) => t.id === trayId)) {
      setTrayId('');
    }
  }, [trayOptions, trayId]);

  useEffect(() => {
    if (customerId && !customerOptions.some((c) => c.id === customerId)) {
      setCustomerId('');
    }
  }, [customerOptions, customerId]);

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
      const emptyWeightKg = parseNonNegative(pallet.emptyWeightKg);
      const traysQuantity = parsePositiveInt(pallet.traysQuantity);
      const grossWeightKg = parseNonNegative(pallet.grossWeightKg);

      if (
        emptyWeightKg === null ||
        traysQuantity === null ||
        grossWeightKg === null ||
        grossWeightKg <= 0
      ) {
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

    const price = parseNonNegative(pricePerKg);
    const saleTotal = price == null ? null : price * fruitKgTotal;

    return {
      lines,
      traysTotal,
      fruitKgTotal,
      grossKgTotal,
      invalid,
      stockOk: traysTotal <= stockAvailable,
      pricePerKg: price,
      saleTotal,
    };
  }, [pallets, unitTrayWeight, stockAvailable, pricePerKg]);

  const canConfirm =
    Boolean(customerId && trayId && currentUserId) &&
    pallets.length > 0 &&
    !computed.invalid &&
    computed.stockOk &&
    computed.pricePerKg !== null &&
    !isSubmitting;

  const openCreateDialog = () => {
    if (!trayId) {
      showAlert({
        message: 'Selecciona el tipo de bandeja antes de agregar pallets',
        type: 'warning',
      });
      return;
    }
    setEditingPallet(null);
    setDialogOpen(true);
  };

  const openEditDialog = (pallet: DispatchPalletDraft) => {
    setEditingPallet(pallet);
    setDialogOpen(true);
  };

  const openPrintDialog = (pallet: DispatchPalletDraft, index: number) => {
    const line = computed.lines[index];
    const emptyWeightKg = parseNonNegative(pallet.emptyWeightKg);
    const traysQuantity = parsePositiveInt(pallet.traysQuantity);
    const grossWeightKg = parseNonNegative(pallet.grossWeightKg);
    const customerName =
      customerOptions.find((c) => c.id === customerId)?.label?.trim() || '—';
    const fruitKg = line?.fruitKg == null ? null : Math.max(0, line.fruitKg);
    const price = computed.pricePerKg;

    setPrintSnapshot({
      palletNumber: index + 1,
      customerName,
      trayName: selectedTray?.label ?? '—',
      unitTrayWeight: unitTrayWeight > 0 ? unitTrayWeight : null,
      emptyWeightKg,
      traysQuantity,
      traysKg: line?.traysKg ?? null,
      grossWeightKg,
      fruitKg,
      pricePerKgCLP: price,
      lineSaleCLP:
        price == null || fruitKg == null
          ? null
          : Number((price * fruitKg).toFixed(0)),
    });
  };

  const handleSavePallet = (pallet: DispatchPalletDraft) => {
    setPallets((prev) => {
      const idx = prev.findIndex((p) => p.key === pallet.key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = pallet;
        return next;
      }
      return [...prev, pallet];
    });
  };

  const handleConfirm = async () => {
    if (!currentUserId) {
      showAlert({ message: 'Debes iniciar sesión para confirmar el despacho', type: 'error' });
      return;
    }
    if (!canConfirm || computed.pricePerKg === null) {
      showAlert({
        message: !computed.stockOk
          ? `Stock insuficiente: disponibles ${stockAvailable}, requeridas ${computed.traysTotal}`
          : 'Completa cliente, bandeja, precio y al menos un pallet válido',
        type: 'warning',
      });
      return;
    }

    let created: CreateDispatchResult | null = null;
    const result = await run(async () => {
      const payload = {
        customerId,
        trayId,
        userId: currentUserId,
        notes: notes.trim() || undefined,
        pricePerKgCLP: computed.pricePerKg!,
        pallets: pallets.map((p) => ({
          emptyWeightKg: Number(String(p.emptyWeightKg).replace(',', '.')),
          traysQuantity: Math.floor(Number(String(p.traysQuantity).replace(',', '.'))),
          grossWeightKg: Number(String(p.grossWeightKg).replace(',', '.')),
        })),
      };

      const createResult = await createDispatch(payload);
      if (createResult.success && createResult.data) {
        created = createResult.data;
        showAlert({
          message: `Despacho #${createResult.data.dispatchId} confirmado`,
          type: 'success',
          duration: 4000,
        });
        return { ok: true };
      }
      showAlert({
        message: createResult.error || 'Error al crear el despacho',
        type: 'error',
        duration: 5000,
      });
      return { ok: false };
    });

    if (result?.ok && created) {
      setDispatchPrint(created);
    }
  };

  const handleCloseDispatchPrint = () => {
    setDispatchPrint(null);
    router.push('/home/dispatch/dispatches');
    router.refresh();
  };

  return (
    <div className="space-y-4" data-test-id="new-dispatch-content">
      <div className="sticky top-[var(--app-topbar-height)] z-20 -mx-page border-b border-border bg-background/95 px-page py-2.5 backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <AutoComplete
              label="Cliente"
              options={customerOptions}
              value={optionById(customerOptions, customerId)}
              onChange={(opt) =>
                setCustomerId((opt as Option | null)?.id ? String((opt as Option).id) : '')
              }
              required
            />
            <AutoComplete
              label="Tipo de bandeja"
              options={traySelectOptions}
              value={optionById(traySelectOptions, trayId)}
              onChange={(opt) =>
                setTrayId((opt as Option | null)?.id ? String((opt as Option).id) : '')
              }
              required
            />
            <TextField
              label="Precio CLP/kg"
              type="number"
              selectOnFocus
              value={pricePerKg}
              onChange={(e) => setPricePerKg(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <SummaryCard label="Pallets" value={String(pallets.length)} />
              <SummaryCard
                label="Bandejas"
                value={String(computed.traysTotal)}
                warn={!computed.stockOk}
              />
              <SummaryCard
                label="Kg netos"
                value={`${kgFmt.format(computed.fruitKgTotal)} kg`}
              />
              <SummaryCard
                label="Precio"
                value={
                  computed.pricePerKg == null
                    ? '—'
                    : `${currencyFmt.format(computed.pricePerKg)}/kg`
                }
              />
              <SummaryCard
                label="Venta total"
                value={
                  computed.saleTotal == null
                    ? '—'
                    : currencyFmt.format(computed.saleTotal)
                }
              />
              {selectedTray ? (
                <SummaryCard
                  label="Stock bandeja"
                  value={`${stockAvailable} · ${kgFmt.format(unitTrayWeight)} kg`}
                  warn={!computed.stockOk}
                />
              ) : null}
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

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <IconButton
            icon="add"
            variant="basicSecondary"
            size="sm"
            title="Agregar pallet"
            ariaLabel="Agregar pallet"
            onClick={openCreateDialog}
            data-test-id="dispatch-add-pallet-button"
          />
          <h3 className="text-base font-semibold text-foreground">Pallets</h3>
        </div>

        {pallets.length === 0 ? (
          <div
            className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-secondary"
            data-test-id="dispatch-pallets-empty"
          >
            Sin pallets. Usa + para agregar el primero.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {pallets.map((pallet, index) => {
              const line = computed.lines[index];
              return (
                <article
                  key={pallet.key}
                  className="flex min-h-[8.5rem] flex-col justify-between rounded-lg border border-border bg-muted/20 p-3"
                  data-test-id={`dispatch-pallet-card-${index}`}
                >
                  <div className="mb-2 flex items-start justify-between gap-1">
                    <span className="text-sm font-semibold text-foreground">
                      #{index + 1}
                    </span>
                    <div className="flex gap-0.5">
                      <IconButton
                        icon="print"
                        variant="basicSecondary"
                        size="xs"
                        title="Imprimir pallet"
                        ariaLabel={`Imprimir pallet ${index + 1}`}
                        onClick={() => openPrintDialog(pallet, index)}
                        data-test-id={`dispatch-pallet-print-${index}`}
                      />
                      <IconButton
                        icon="edit"
                        variant="basicSecondary"
                        size="xs"
                        title="Editar pallet"
                        ariaLabel={`Editar pallet ${index + 1}`}
                        onClick={() => openEditDialog(pallet)}
                      />
                      <IconButton
                        icon="delete"
                        variant="basicSecondary"
                        size="xs"
                        title="Quitar pallet"
                        ariaLabel={`Quitar pallet ${index + 1}`}
                        onClick={() =>
                          setPallets((prev) => prev.filter((p) => p.key !== pallet.key))
                        }
                      />
                    </div>
                  </div>
                  <dl className="space-y-1 text-xs text-secondary">
                    <div className="flex justify-between gap-2">
                      <dt>Bandejas</dt>
                      <dd className="font-medium text-foreground">
                        {line?.traysQuantity || pallet.traysQuantity || '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Bruto</dt>
                      <dd className="font-medium text-foreground">
                        {line?.grossWeightKg
                          ? `${kgFmt.format(line.grossWeightKg)} kg`
                          : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Fruta</dt>
                      <dd
                        className={`font-medium ${
                          line?.fruitKg != null && line.fruitKg < 0
                            ? 'text-destructive'
                            : 'text-foreground'
                        }`}
                      >
                        {line?.fruitKg == null ? '—' : `${kgFmt.format(line.fruitKg)} kg`}
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <TextField
        label="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <AddEditDispatchPalletDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingPallet(null);
        }}
        unitTrayWeight={unitTrayWeight}
        trayLabel={selectedTray?.label}
        initial={editingPallet}
        onSave={handleSavePallet}
      />

      <PrintDispatchPalletDialog
        open={Boolean(printSnapshot)}
        onClose={() => setPrintSnapshot(null)}
        snapshot={printSnapshot}
      />

      <PrintDispatchDialog
        open={Boolean(dispatchPrint)}
        onClose={handleCloseDispatchPrint}
        snapshot={dispatchPrint}
      />
    </div>
  );
}
