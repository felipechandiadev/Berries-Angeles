'use client';

import DialogToPrint from '@/app/baseComponents/Dialog/DialogToPrint';

export type DispatchPalletPrintSnapshot = {
  /** Título / número mostrado (ej. 1 o id del pallet). */
  palletNumber: number | string;
  customerName?: string;
  trayName: string;
  unitTrayWeight: number | null;
  emptyWeightKg: number | null;
  traysQuantity: number | null;
  traysKg: number | null;
  grossWeightKg: number | null;
  fruitKg: number | null;
  pricePerKgCLP?: number | null;
  lineSaleCLP?: number | null;
  statusLabel?: string;
  capacity?: number | null;
};

interface PrintDispatchPalletDialogProps {
  open: boolean;
  onClose: () => void;
  snapshot: DispatchPalletPrintSnapshot | null;
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

export default function PrintDispatchPalletDialog({
  open,
  onClose,
  snapshot,
}: PrintDispatchPalletDialogProps) {
  return (
    <DialogToPrint
      open={open && Boolean(snapshot)}
      onClose={onClose}
      title={snapshot ? `Imprimir pallet #${snapshot.palletNumber}` : 'Imprimir pallet'}
      size="xs"
      contentClassName="bg-white"
      printLabel="Imprimir"
    >
      {snapshot ? (
        <div
          className="mx-auto flex flex-col gap-2 text-[11px] leading-tight text-foreground"
          style={{ width: '70mm', maxWidth: '80mm' }}
          data-test-id="dispatch-pallet-print-ticket"
        >
          <header className="text-center">
            <h3 className="text-sm font-semibold uppercase">Pallet</h3>
            <p className="text-[10px] text-secondary">#{snapshot.palletNumber}</p>
          </header>

          <section className="flex flex-col gap-1 border-t border-dashed border-border pt-2">
            {snapshot.customerName ? (
              <Row label="Cliente" value={snapshot.customerName} />
            ) : null}
            <Row label="Bandeja" value={snapshot.trayName || '—'} />
            <Row label="Peso unit. bandeja" value={formatKg(snapshot.unitTrayWeight)} />
            {snapshot.statusLabel ? (
              <Row label="Estado" value={snapshot.statusLabel} />
            ) : null}
            {snapshot.capacity != null ? (
              <Row label="Capacidad" value={String(snapshot.capacity)} />
            ) : null}
          </section>

          <section className="flex flex-col gap-1 border-t border-dashed border-border pt-2">
            <Row label="Peso pallet" value={formatKg(snapshot.emptyWeightKg)} />
            <Row
              label="Cantidad bandejas"
              value={
                snapshot.traysQuantity == null ? '—' : String(snapshot.traysQuantity)
              }
            />
            <Row label="Bandejas kg" value={formatKg(snapshot.traysKg)} />
            <Row label="Peso bruto" value={formatKg(snapshot.grossWeightKg)} />
            <Row label="Fruta neta" value={formatKg(snapshot.fruitKg)} />
          </section>

          {(snapshot.pricePerKgCLP != null || snapshot.lineSaleCLP != null) && (
            <section className="flex flex-col gap-1 border-t border-dashed border-border pt-2">
              {snapshot.pricePerKgCLP != null && (
                <Row
                  label="Precio"
                  value={`${currencyFmt.format(snapshot.pricePerKgCLP)}/kg`}
                />
              )}
              {snapshot.lineSaleCLP != null && (
                <Row
                  label="Venta línea"
                  value={currencyFmt.format(snapshot.lineSaleCLP)}
                />
              )}
            </section>
          )}

          <footer className="border-t border-dashed border-border pt-2 text-center text-[9px] text-secondary">
            Bruto − pallet − bandejas = fruta neta
          </footer>
        </div>
      ) : null}
    </DialogToPrint>
  );
}
