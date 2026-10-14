'use client';

import { formatAuditDate } from '@/lib/dateTimeUtils';
import type { CustomerSectionProps } from '../../customer-detail.types';

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const kgFmt = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });

export function DispatchesSection({ data }: CustomerSectionProps) {
  const { dispatches } = data;

  return (
    <div className="min-h-0 flex-1 overflow-auto" data-test-id="customer-detail-dispatches">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Folio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Bandeja
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Kg fruta
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Bandejas
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pallets
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Venta
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {dispatches.length > 0 ? (
              dispatches.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                    {row.id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {formatAuditDate(String(row.createdAt))}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
                    {row.trayName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-foreground">
                    {kgFmt.format(row.fruitKgTotal)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-foreground">
                    {row.traysTotal}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-foreground">
                    {row.palletsCount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium tabular-nums text-foreground">
                    {clp.format(row.saleTotalCLP)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No hay despachos registrados para este cliente
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
