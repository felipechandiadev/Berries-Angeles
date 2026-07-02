'use client';

import { useCallback, useMemo } from 'react';
import DataGrid, { type DataGridColumn } from '@/app/baseComponents/DataGrid/DataGrid';
import type { AdvanceSummary, AdvancePaymentMethod } from '@/app/actions/advances';
import { formatAuditDate } from '@/lib/dateTimeUtils';
import DetailButton from './DetailButton';
import PrintButton from './PrintButton';
import CreateAdvanceButton from './CreateAdvanceButton';
import DeleteAdvanceButton from './DeleteAdvanceButton';

interface AdvancesGridProps {
  rows: AdvanceSummary[];
  onRefresh?: () => void;
}

const clpFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const paymentLabels: Record<AdvancePaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CHECK: 'Cheque',
};

function formatCLP(value: number): string {
  return clpFormatter.format(Number.isFinite(value) ? value : 0);
}

const AdvancesGrid = ({ rows, onRefresh }: AdvancesGridProps) => {
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  const columns = useMemo<DataGridColumn[]>(
    () => [
      {
        field: 'transactionId',
        headerName: 'ID',
        flex: 0.7,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => <span className="font-mono text-xs text-foreground">{value}</span>,
      },
      {
        field: 'createdAt',
        headerName: 'Fecha',
        flex: 1,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => <span>{value ? formatAuditDate(String(value)) : '—'}</span>,
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
        field: 'paymentMethod',
        headerName: 'Pago',
        flex: 0.8,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => paymentLabels[(value as AdvancePaymentMethod) ?? 'CASH'],
      },
      {
        field: 'amount',
        headerName: 'Monto',
        flex: 1,
        sortable: true,
        filterable: false,
        renderCell: ({ value }) => formatCLP(Number(value) || 0),
      },
      {
        field: 'actions',
        headerName: '',
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => (
          <div className="flex gap-1">
            <DetailButton advanceId={row.id} />
            <PrintButton advanceId={row.id} />
            <DeleteAdvanceButton
              advanceId={row.id}
              producerName={row.producerName}
              amountLabel={formatCLP(Number(row.amount) || 0)}
              onSuccess={handleRefresh}
            />
          </div>
        ),
      },
    ],
    [handleRefresh],
  );

  return (
 
      <DataGrid
        title="Anticipos"
        columns={columns}
        rows={rows}
        totalRows={rows.length}
        height="85vh"
        showBorder={false}
        createForm={<CreateAdvanceButton onSuccess={handleRefresh} />}
        createFormTitle="Crear anticipo"
      
      />

  );
};

export default AdvancesGrid;
