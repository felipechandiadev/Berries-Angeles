'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataGridTable as DataGrid, type DataGridColumn } from '@felipechandiadev/ui';
import type { SettlementStatus, SettlementSummary } from '@/app/actions/settlements';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import { formatAuditDate } from '@/lib/dateTimeUtils';
import DeleteSettlementButton from './DeleteSettlementButton';

interface SettlementsGridProps {
  rows: SettlementSummary[];
  totalRows: number;
}

const clpFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

function formatCLP(value: number): string {
  return clpFormatter.format(Number.isFinite(value) ? value : 0);
}

const statusLabel = (status: SettlementStatus | unknown): string =>
  status === 'BORRADOR' ? 'Borrador' : 'Completa';

const SettlementsGrid = ({ rows, totalRows }: SettlementsGridProps) => {
  const router = useRouter();

  const columns = useMemo<DataGridColumn[]>(
    () => [
      {
        field: 'createdAt',
        headerName: 'Fecha',
        flex: 1,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => (
          <span>{value ? formatAuditDate(String(value)) : '—'}</span>
        ),
      },
      {
        field: 'transactionId',
        headerName: 'ID',
        flex: 0.7,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => (
          <span className="font-mono text-xs text-foreground">{value}</span>
        ),
      },
      {
        field: 'status',
        headerName: 'Estado',
        flex: 0.8,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => {
          const isDraft = value === 'BORRADOR';
          return (
            <span
              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                isDraft
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {statusLabel(value)}
            </span>
          );
        },
      },
      {
        field: 'producerName',
        headerName: 'Productor',
        flex: 1.2,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => <span className="truncate">{value || '—'}</span>,
      },
      {
        field: 'seasonName',
        headerName: 'Temporada',
        flex: 1,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => <span className="truncate">{value || '—'}</span>,
      },
      {
        field: 'receptionsCount',
        headerName: 'Recepciones',
        flex: 0.7,
        sortable: true,
        filterable: false,
        renderCell: ({ value }) => <span>{Number(value) || 0}</span>,
      },
      {
        field: 'receptionsTotalCLP',
        headerName: 'Total recepciones',
        flex: 1,
        sortable: true,
        filterable: false,
        renderCell: ({ value }) => formatCLP(Number(value) || 0),
      },
      {
        field: 'advancesCount',
        headerName: 'Anticipos',
        flex: 0.7,
        sortable: true,
        filterable: false,
        renderCell: ({ value }) => <span>{Number(value) || 0}</span>,
      },
      {
        field: 'advancesAppliedCLP',
        headerName: 'Anticipos aplicados',
        flex: 1,
        sortable: true,
        filterable: false,
        renderCell: ({ value }) => formatCLP(Number(value) || 0),
      },
      {
        field: 'netAmountCLP',
        headerName: 'Neto',
        flex: 1,
        sortable: true,
        filterable: false,
        renderCell: ({ value }) => (
          <span className="font-semibold">{formatCLP(Number(value) || 0)}</span>
        ),
      },
      {
        field: 'operatorName',
        headerName: 'Operador',
        flex: 1,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => <span className="truncate">{value || '—'}</span>,
      },
      {
        field: 'actions',
        headerName: '',
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => {
          const isDraft = row.status === 'BORRADOR';
          return (
            <div className="flex gap-1">
              {isDraft && (
                <IconButton
                  icon="edit"
                  variant="basicSecondary"
                  size="sm"
                  ariaLabel="Continuar borrador"
                  title="Continuar borrador"
                  onClick={() => {
                    router.push(
                      `/home/economicManagement/settlements?tab=new&settlementId=${row.id}`,
                    );
                  }}
                />
              )}
              <DeleteSettlementButton
                settlementId={String(row.id)}
                producerName={row.producerName as string | undefined}
                statusLabel={statusLabel(row.status)}
              />
            </div>
          );
        },
      },
    ],
    [router],
  );

  if (totalRows === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-secondary">
        <p>No hay liquidaciones.</p>
      </div>
    );
  }

  return (
    <DataGrid
      title="Liquidaciones"
      columns={columns}
      rows={rows}
      totalRows={totalRows}
      height="85vh"
      showBorder={false}
    />
  );
};

export default SettlementsGrid;
