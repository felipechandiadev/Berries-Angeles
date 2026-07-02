'use client';

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface SettlementSummaryProps {
  receptionsCount: number;
  receptionsTotal: number;
  advancesCount: number;
  advancesTotal: number;
  balance: number;
}

export default function SettlementSummary({
  receptionsCount,
  receptionsTotal,
  advancesCount,
  advancesTotal,
  balance,
}: SettlementSummaryProps) {
  const balanceLabel = balance >= 0 ? 'Saldo a pagar' : 'Saldo a favor productor';
  const balanceValue = Math.abs(balance);

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-primary">Resumen de liquidación</h2>
        <p className="text-sm text-muted-foreground">Totales de los elementos seleccionados.</p>
      </div>

      <div className="flex h-full flex-col justify-between rounded-lg border border-border bg-background p-6 shadow-sm">
        <dl className="flex flex-1 flex-col gap-4 text-sm sm:gap-5">
          <div className="rounded-md border border-border/60 bg-muted/20 p-3">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Recepciones seleccionadas</dt>
            <dd className="mt-2 flex items-baseline justify-between gap-3">
              <span className="text-xl font-semibold text-foreground">{receptionsCount}</span>
              <span className="text-sm font-medium text-primary">{currencyFormatter.format(receptionsTotal)}</span>
            </dd>
          </div>

          <div className="rounded-md border border-border/60 bg-muted/20 p-3">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Anticipos seleccionados</dt>
            <dd className="mt-2 flex items-baseline justify-between gap-3">
              <span className="text-xl font-semibold text-foreground">{advancesCount}</span>
              <span className="text-sm font-medium text-primary">{currencyFormatter.format(advancesTotal)}</span>
            </dd>
          </div>

          <div className="rounded-md border border-dashed border-primary/50 bg-primary/5 p-4">
            <dt className="text-xs uppercase tracking-wide text-primary">{balanceLabel}</dt>
            <dd className="mt-2 text-3xl font-semibold text-primary">{currencyFormatter.format(balanceValue)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
