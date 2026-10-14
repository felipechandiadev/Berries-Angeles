'use client';

import type { ReactNode } from 'react';
import type { CustomerSectionProps } from '../../customer-detail.types';

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const kgFmt = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-lg border border-border bg-background p-4"
      data-test-id={`customer-summary-stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-xl font-semibold tabular-nums text-foreground">{value}</span>
      {hint ? (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  );
}

export function SummarySection({ data }: CustomerSectionProps) {
  const { customer, dispatches, trays } = data;

  const fruitKgTotal = dispatches.reduce((sum, d) => sum + (Number(d.fruitKgTotal) || 0), 0);
  const saleTotalCLP = dispatches.reduce((sum, d) => sum + (Number(d.saleTotalCLP) || 0), 0);
  const palletsTotal = dispatches.reduce((sum, d) => sum + (Number(d.palletsCount) || 0), 0);

  const trayBalanceEntries = Object.entries(trays.balance);
  const trayOwed = trayBalanceEntries
    .filter(([, count]) => count > 0)
    .reduce((sum, [, count]) => sum + count, 0);
  const trayFavor = trayBalanceEntries
    .filter(([, count]) => count < 0)
    .reduce((sum, [, count]) => sum + Math.abs(count), 0);

  const bankCount = customer.person?.bankAccounts?.length ?? 0;
  const primaryAccount = customer.person?.bankAccounts?.find((a) => a.isPrimary);

  return (
    <div className="space-y-8" data-test-id="customer-detail-summary">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoRow label="RUT" value={customer.dni || '—'} />
        <InfoRow label="Correo" value={customer.mail || '—'} />
        <InfoRow label="Teléfono" value={customer.phone || '—'} />
        <InfoRow
          label="Cuentas bancarias"
          value={
            bankCount === 0
              ? 'Sin cuentas'
              : primaryAccount
                ? `${bankCount} · Principal: ${primaryAccount.bank}`
                : String(bankCount)
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Despachos"
          value={String(dispatches.length)}
          hint={
            dispatches.length === 0
              ? undefined
              : `${palletsTotal} pallets · ${clp.format(saleTotalCLP)} venta`
          }
        />
        <StatCard
          label="Kg fruta"
          value={kgFmt.format(fruitKgTotal)}
          hint="Total despachos"
        />
        <StatCard
          label="Bandejas"
          value={trayOwed > 0 ? String(trayOwed) : trayFavor > 0 ? String(trayFavor) : '0'}
          hint={
            trayOwed > 0
              ? `Debe ${trayOwed}`
              : trayFavor > 0
                ? `A favor ${trayFavor}`
                : 'Sin deuda'
          }
        />
      </div>
    </div>
  );
}
