'use client';

import type { ReactNode } from 'react';
import type { SettlementMetadata } from '@/data/entities/Transaction';
import { TrayFavorInfoButton } from '../TrayFavorInfoButton';
import type { SectionProps } from '../producer-detail.types';

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

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
      data-test-id={`producer-summary-stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
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

export function SummarySection({ data }: SectionProps) {
  const { producer, receptions, advances, settlements, trays } = data;

  const pendingReceptions = receptions.filter((r) => r.status !== 'Liquidada');
  const settledReceptions = receptions.filter((r) => r.status === 'Liquidada');
  const pendingReceptionsCLP = pendingReceptions.reduce(
    (sum, r) => sum + (Number(r.amount) || 0),
    0,
  );
  const receptionsNetKg = receptions.reduce((sum, r) => sum + (Number(r.netWeight) || 0), 0);

  const pendingAdvances = advances.filter((a) => a.status !== 'Liquidado');
  const settledAdvances = advances.filter((a) => a.status === 'Liquidado');
  const pendingAdvancesCLP = pendingAdvances.reduce(
    (sum, a) => sum + (Number(a.amount) || 0),
    0,
  );

  const completedSettlements = settlements.filter((s) => {
    const meta = s.metadata as SettlementMetadata | undefined;
    return meta?.status !== 'BORRADOR';
  });
  const settlementsNetCLP = completedSettlements.reduce((sum, s) => {
    const meta = s.metadata as SettlementMetadata | undefined;
    return sum + (Number(meta?.netAmountCLP ?? s.amount) || 0);
  }, 0);

  const trayBalanceEntries = Object.entries(trays.balance);
  const trayOwed = trayBalanceEntries
    .filter(([, count]) => count > 0)
    .reduce((sum, [, count]) => sum + count, 0);
  const trayFavor = trayBalanceEntries
    .filter(([, count]) => count < 0)
    .reduce((sum, [, count]) => sum + Math.abs(count), 0);

  const bankCount = producer.person?.bankAccounts?.length ?? 0;
  const primaryAccount = producer.person?.bankAccounts?.find((a) => a.isPrimary);

  return (
    <div className="space-y-8" data-test-id="producer-detail-summary">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoRow label="RUT" value={producer.dni || '—'} />
        <InfoRow label="Correo" value={producer.mail || '—'} />
        <InfoRow label="Teléfono" value={producer.phone || '—'} />
        <InfoRow label="Unidad productiva" value={producer.productiveUnit?.name || '—'} />
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
          label="Recepciones"
          value={String(receptions.length)}
          hint={
            receptions.length === 0
              ? undefined
              : `${pendingReceptions.length} pendientes · ${settledReceptions.length} liquidadas · ${clp.format(pendingReceptionsCLP)} pend.`
          }
        />
        <StatCard
          label="Kg netos"
          value={new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(
            receptionsNetKg,
          )}
          hint="Total recepciones"
        />
        <StatCard
          label="Anticipos"
          value={String(advances.length)}
          hint={
            advances.length === 0
              ? undefined
              : `${pendingAdvances.length} pendientes · ${settledAdvances.length} liquidados · ${clp.format(pendingAdvancesCLP)} pend.`
          }
        />
        <StatCard
          label="Liquidaciones"
          value={String(settlements.length)}
          hint={
            settlements.length === 0
              ? undefined
              : `${completedSettlements.length} finalizadas · ${clp.format(settlementsNetCLP)} neto`
          }
        />
        <StatCard
          label="Bandejas"
          value={trayOwed > 0 ? String(trayOwed) : trayFavor > 0 ? String(trayFavor) : '0'}
          hint={
            trayOwed > 0 ? (
              `Debe ${trayOwed}`
            ) : trayFavor > 0 ? (
              <>
                A favor {trayFavor}
                <TrayFavorInfoButton />
              </>
            ) : (
              'Sin deuda'
            )
          }
        />
      </div>
    </div>
  );
}
