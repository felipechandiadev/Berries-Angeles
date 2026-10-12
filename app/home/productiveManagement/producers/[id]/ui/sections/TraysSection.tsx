'use client';

import { formatAuditDate } from '@/lib/dateTimeUtils';
import { translateTransactionType } from '@/lib/transactionUtils';
import { TrayFavorInfoButton } from '../TrayFavorInfoButton';
import type { SectionProps } from '../producer-detail.types';

export function TraysSection({ data }: SectionProps) {
  return (
    <div className="flex flex-col gap-6 overflow-auto" data-test-id="producer-detail-trays">
      <div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Object.entries(data.trays.balance).length > 0 ? (
            Object.entries(data.trays.balance).map(([type, count]) => (
              <div key={type} className="flex flex-col p-3">
                <span className="text-sm font-medium uppercase text-muted-foreground">{type}</span>
                <span
                  className={`text-2xl font-bold ${count > 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {Math.abs(count)}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {count > 0 ? 'Debe' : 'A favor'}
                  {count <= 0 ? <TrayFavorInfoButton /> : null}
                </span>
              </div>
            ))
          ) : (
            <div className="italic text-muted-foreground">No hay deuda de bandejas registrada.</div>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
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
                  Tipo de bandeja
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tipo de movimiento
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Cantidad
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.trays.movements.length > 0 ? (
                data.trays.movements.map((movement) => {
                  const metadata = movement.metadata as Record<string, unknown> | undefined;
                  const qty = Number(
                    metadata?.quantity ??
                      metadata?.quantityReturned ??
                      metadata?.quantityDelivered ??
                      movement.amount ??
                      0,
                  );
                  return (
                    <tr key={movement.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                        {movement.id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                        {formatAuditDate(String(movement.createdAt))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
                        {(metadata?.trayLabel as string) || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
                        {translateTransactionType(movement.type)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold">
                        <span
                          className={
                            movement.direction === 'OUT' ? 'text-red-600' : 'text-green-600'
                          }
                        >
                          {movement.direction === 'OUT' ? '-' : '+'}
                          {qty}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No hay movimientos de bandejas registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
