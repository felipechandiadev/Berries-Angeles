'use client';

import type { SettlementMetadata } from '@/data/entities/Transaction';
import type { SectionProps } from '../producer-detail.types';

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export function SettlementsSection({ data }: SectionProps) {
  return (
    <div className="overflow-auto" data-test-id="producer-detail-settlements">
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
                Anticipos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Recepciones
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.settlements.length > 0 ? (
              data.settlements.map((settlement) => {
                const metadata = settlement.metadata as SettlementMetadata | undefined;
                const isDraft = metadata?.status === 'BORRADOR';
                return (
                  <tr key={settlement.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                      {settlement.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {new Date(settlement.createdAt).toLocaleDateString('es-CL')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {clp.format(metadata?.advancesAppliedCLP || 0)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {clp.format(metadata?.receptionsTotalCLP || 0)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                      {clp.format(
                        Number(metadata?.netAmountCLP ?? settlement.amount) || 0,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          isDraft
                            ? 'bg-neutral-100 text-neutral-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {isDraft ? 'Borrador' : 'Finalizada'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No hay liquidaciones registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
