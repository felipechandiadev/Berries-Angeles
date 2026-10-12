'use client';

import { useMemo, useState } from 'react';
import { DataGridTable as DataGrid, type DataGridColumn } from '@felipechandiadev/ui';
import type { DispatchSummaryRow } from '@/app/actions/dispatches';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import { formatAuditDate } from '@/lib/dateTimeUtils';
import DispatchDetailDialog from './DispatchDetailDialog';

interface DispatchesGridProps {
  rows: DispatchSummaryRow[];
  totalRows: number;
  currentLimit: number;
  currentSearch?: string;
  currentFilters?: string;
  currentSort?: string;
  currentSortField?: string;
}

const kgFmt = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export default function DispatchesGrid({
  rows,
  totalRows,
  currentLimit,
  currentSearch,
  currentFilters,
  currentSort,
  currentSortField,
}: DispatchesGridProps) {
  const [detailId, setDetailId] = useState<string | null>(null);

  const columns = useMemo<DataGridColumn[]>(
    () => [
      {
        field: 'id',
        headerName: 'Folio',
        flex: 0.8,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => (
          <span className="font-mono text-xs text-foreground">{value}</span>
        ),
      },
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
        field: 'customerName',
        headerName: 'Cliente',
        flex: 1.3,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => <span className="truncate">{value || '—'}</span>,
      },
      {
        field: 'trayName',
        headerName: 'Bandeja',
        flex: 1,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => <span className="truncate">{value || '—'}</span>,
      },
      {
        field: 'palletsCount',
        headerName: 'Pallets',
        flex: 0.7,
        sortable: true,
        filterable: false,
        renderCell: ({ value }) => <span>{Number(value) || 0}</span>,
      },
      {
        field: 'traysTotal',
        headerName: 'Bandejas',
        flex: 0.7,
        sortable: true,
        filterable: false,
        renderCell: ({ value }) => <span>{Number(value) || 0}</span>,
      },
      {
        field: 'fruitKgTotal',
        headerName: 'Fruta kg',
        flex: 0.9,
        sortable: true,
        filterable: false,
        renderCell: ({ value }) => <span>{kgFmt.format(Number(value) || 0)}</span>,
      },
      {
        field: 'actions',
        headerName: '',
        flex: 0.5,
        sortable: false,
        filterable: false,
        actionComponent: ({ row }: { row: DispatchSummaryRow }) => (
          <IconButton
            icon="more_horiz"
            variant="basicSecondary"
            size="xs"
            title="Ver detalle"
            ariaLabel="Ver detalle del despacho"
            onClick={() => setDetailId(row.id)}
          />
        ),
      },
    ],
    [],
  );

  return (
    <>
      <DataGrid
        title="Despachos"
        columns={columns}
        rows={rows}
        limit={currentLimit}
        totalRows={totalRows}
        search={currentSearch}
        filters={currentFilters}
        sort={currentSort?.toLowerCase() as 'asc' | 'desc' | undefined}
        sortField={currentSortField}
        height="75vh"
        showBorder={false}
      />
      <DispatchDetailDialog
        open={Boolean(detailId)}
        dispatchId={detailId}
        onClose={() => setDetailId(null)}
      />
    </>
  );
}
