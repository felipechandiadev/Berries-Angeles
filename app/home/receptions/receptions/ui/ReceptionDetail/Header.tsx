'use client';

import { Button } from '@/app/baseComponents/Button/Button';
import type { ReceptionDetailSummary, ReceptionDetailTotals } from './types';

interface ReceptionDetailHeaderProps {
  summary: ReceptionDetailSummary;
  totals?: ReceptionDetailTotals | null;
  onClose: () => void;
}

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 2,
});

export function ReceptionDetailHeader({ summary, totals, onClose }: ReceptionDetailHeaderProps) {

  const payLabel = totals?.totalCLPToPay ?? summary.totalCLPToPay ?? summary.amount;
  const formattedPayLabel = currencyFormatter.format(payLabel || 0);

  const clpValue = totals?.payableCLP ?? 0;
  const usdValue = totals?.payableUSD ?? 0;
  const exchangeRateValue = summary.exchangeRate ?? 0;

  return (
    <header className="flex flex-col gap-4 border-b border-gray-200 pb-4">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-gray-900">
            Recepción #{summary.id}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outlined" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-sky-100 text-sky-800">
          <span className="text-xs font-medium">CLP</span>
          <span className="text-lg font-semibold">{currencyFormatter.format(clpValue)}</span>
        </div>
        <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-green-100 text-green-800">
          <span className="text-xs font-medium">USD</span>
          <span className="text-lg font-semibold">{usdFormatter.format(usdValue)}</span>
        </div>
        <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-gray-100 text-gray-800">
          <span className="text-xs font-medium">Cambio</span>
          <span className="text-lg font-semibold">{numberFormatter.format(exchangeRateValue)}</span>
        </div>
        <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-blue-100 text-blue-800">
          <span className="text-xs font-medium">A PAGAR</span>
          <span className="text-lg font-semibold">{formattedPayLabel}</span>
        </div>
      </div>
    </header>
  );
}
