'use client';

import { Button } from '@/app/baseComponents/Button/Button';

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
  canSave: boolean;
  validationError?: string | null;
  isSubmitting: boolean;
  onSaveDraft: () => void;
  onComplete: () => void;
}

export default function SettlementSummary({
  receptionsCount,
  receptionsTotal,
  advancesCount,
  advancesTotal,
  balance,
  canSave,
  validationError,
  isSubmitting,
  onSaveDraft,
  onComplete,
}: SettlementSummaryProps) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-primary">Resumen de liquidación</h2>
        <p className="text-sm text-muted-foreground">
          Revisa los totales y guarda como borrador o completa la liquidación.
        </p>
      </div>

      <div className="flex h-full flex-col justify-between rounded-lg border border-border bg-background p-6 shadow-sm">
        <dl className="flex flex-1 flex-col gap-4 text-sm sm:gap-5">
          <div className="rounded-md border border-border/60 bg-muted/20 p-3">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Recepciones seleccionadas
            </dt>
            <dd className="mt-2 flex items-baseline justify-between gap-3">
              <span className="text-xl font-semibold text-foreground">{receptionsCount}</span>
              <span className="text-sm font-medium text-primary">
                {currencyFormatter.format(receptionsTotal)}
              </span>
            </dd>
          </div>

          <div className="rounded-md border border-border/60 bg-muted/20 p-3">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Anticipos seleccionados
            </dt>
            <dd className="mt-2 flex items-baseline justify-between gap-3">
              <span className="text-xl font-semibold text-foreground">{advancesCount}</span>
              <span className="text-sm font-medium text-primary">
                {currencyFormatter.format(advancesTotal)}
              </span>
            </dd>
          </div>

          <div className="rounded-md border border-dashed border-primary/50 bg-primary/5 p-4">
            <dt className="text-xs uppercase tracking-wide text-primary">Saldo a pagar</dt>
            <dd className="mt-2 text-3xl font-semibold text-primary">
              {currencyFormatter.format(balance)}
            </dd>
          </div>
        </dl>

        {validationError && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {validationError}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outlined"
            className="w-full"
            disabled={!canSave || isSubmitting}
            loading={isSubmitting}
            onClick={onSaveDraft}
          >
            Guardar borrador
          </Button>
          <Button
            type="button"
            variant="primary"
            className="w-full"
            disabled={!canSave || isSubmitting}
            loading={isSubmitting}
            onClick={onComplete}
          >
            Completar liquidación
          </Button>
        </div>
      </div>
    </section>
  );
}
