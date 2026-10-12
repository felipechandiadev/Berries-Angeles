'use client';

import type { SectionProps } from '../producer-detail.types';

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export function ReceptionsSection({ data }: SectionProps) {
  return (
    <div className="overflow-auto" data-test-id="producer-detail-receptions">
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
                Variedad
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Calidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Neto KG
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Precio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Monto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.receptions.length > 0 ? (
              data.receptions.map((reception) => (
                <tr key={reception.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
                    {reception.id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {new Date(reception.createdAt).toLocaleDateString('es-CL')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {reception.variety}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {reception.formatName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(
                      reception.netWeight || 0,
                    )}{' '}
                    KG
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {clp.format(reception.price || 0)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {clp.format(Number(reception.amount) || 0)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        reception.status === 'Liquidada' || reception.status === 'Pagada'
                          ? 'bg-green-100 text-green-800'
                          : reception.status === 'Liq. borrador'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {reception.status || 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No hay recepciones registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
