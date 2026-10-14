'use client';

import { useState } from 'react';
import DialogToPrint from '@/app/baseComponents/Dialog/DialogToPrint';
import { Button } from '@/app/baseComponents/Button/Button';
import type { CreateDispatchResult } from '@/app/actions/dispatches';
import PrintDispatchPalletDialog, {
  type DispatchPalletPrintSnapshot,
} from './PrintDispatchPalletDialog';

export type DispatchPrintSnapshot = CreateDispatchResult;

interface PrintDispatchDialogProps {
  open: boolean;
  onClose: () => void;
  snapshot: DispatchPrintSnapshot | null;
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

function formatKg(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${kgFmt.format(value)} kg`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-[10px]">
      <span className="text-secondary">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function PrintDispatchDialog({
  open,
  onClose,
  snapshot,
}: PrintDispatchDialogProps) {
  const [palletSnapshot, setPalletSnapshot] =
    useState<DispatchPalletPrintSnapshot | null>(null);

  const openPalletTicket = (line: DispatchPrintSnapshot['palletLines'][number]) => {
    if (!snapshot) return;
    const traysKg = Number(
      (line.traysQuantity * snapshot.unitTrayWeight).toFixed(3),
    );
    setPalletSnapshot({
      palletNumber: line.palletId,
      customerName: snapshot.customerName,
      trayName: snapshot.trayName,
      unitTrayWeight: snapshot.unitTrayWeight,
      emptyWeightKg: line.emptyWeightKg,
      traysQuantity: line.traysQuantity,
      traysKg,
      grossWeightKg: line.grossWeightKg,
      fruitKg: line.fruitWeightKg,
      pricePerKgCLP: snapshot.pricePerKgCLP,
      lineSaleCLP: Number(
        (snapshot.pricePerKgCLP * line.fruitWeightKg).toFixed(0),
      ),
      statusLabel: 'Despachado',
    });
  };

  return (
    <>
      <DialogToPrint
        open={open && Boolean(snapshot)}
        onClose={onClose}
        title={
          snapshot ? `Imprimir despacho #${snapshot.dispatchId}` : 'Imprimir despacho'
        }
        size="sm"
        contentClassName="bg-white"
        printLabel="Imprimir ticket"
      >
        {snapshot ? (
          <div
            className="mx-auto flex flex-col gap-3 text-[11px] leading-tight text-foreground"
            style={{ width: '80mm', maxWidth: '90mm' }}
            data-test-id="dispatch-print-ticket"
          >
            <header className="text-center">
              <h3 className="text-sm font-semibold uppercase">Despacho</h3>
              <p className="text-[10px] text-secondary">#{snapshot.dispatchId}</p>
            </header>

            <section className="flex flex-col gap-1 border-t border-dashed border-border pt-2">
              <Row label="Cliente" value={snapshot.customerName || '—'} />
              <Row label="Bandeja" value={snapshot.trayName || '—'} />
              <Row label="Pallets" value={String(snapshot.palletIds.length)} />
              <Row label="Bandejas" value={String(snapshot.traysTotal)} />
              <Row label="Kg fruta" value={formatKg(snapshot.fruitKgTotal)} />
              <Row label="Kg bruto" value={formatKg(snapshot.grossKgTotal)} />
              <Row
                label="Precio"
                value={`${currencyFmt.format(snapshot.pricePerKgCLP)}/kg`}
              />
              <Row
                label="Venta total"
                value={currencyFmt.format(snapshot.saleTotalCLP)}
              />
            </section>

            <section className="flex flex-col gap-1.5 border-t border-dashed border-border pt-2 print:hidden">
              <p className="text-[10px] font-medium text-secondary">Tickets de pallet</p>
              {snapshot.palletLines.map((line) => (
                <div
                  key={line.palletId}
                  className="flex items-center justify-between gap-2 rounded border border-border px-2 py-1"
                >
                  <span className="text-[10px]">
                    #{line.palletId} · {formatKg(line.fruitWeightKg)}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outlined"
                    onClick={() => openPalletTicket(line)}
                    data-test-id={`dispatch-print-pallet-${line.palletId}`}
                  >
                    Imprimir
                  </Button>
                </div>
              ))}
            </section>

            <footer className="border-t border-dashed border-border pt-2 text-center text-[9px] text-secondary">
              Cerrar para volver al listado de despachos
            </footer>
          </div>
        ) : null}
      </DialogToPrint>

      <PrintDispatchPalletDialog
        open={Boolean(palletSnapshot)}
        onClose={() => setPalletSnapshot(null)}
        snapshot={palletSnapshot}
      />
    </>
  );
}
