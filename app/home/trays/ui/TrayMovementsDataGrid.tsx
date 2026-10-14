'use client';

// Tray movements DataGrid component

import { useMemo } from 'react';
import { DataGridTable as DataGrid, type DataGridColumn } from '@felipechandiadev/ui';
import { formatAuditDate } from '@/lib/dateTimeUtils';
import type { TrayTransactionRow } from '@/app/actions/transactions';

interface TrayMovementsDataGridProps {
  data: TrayTransactionRow[];
  totalRows: number;
  currentLimit: number;
  currentSearch?: string;
  currentFilters?: string;
  currentSort?: string;
  currentSortField?: string;
}

interface RenderCellParams {
  row: TrayTransactionRow;
}

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function TrayMovementsDataGrid({
  data,
  totalRows,
  currentLimit,
  currentSearch,
  currentFilters,
  currentSort,
  currentSortField,
}: TrayMovementsDataGridProps) {
  const columns: DataGridColumn[] = useMemo(() => [
    {
      field: 'id',
      headerName: 'Folio',
      width: 80,
      sortable: true,
      filterable: true,
      renderCell: (params: RenderCellParams) => (
        <span className="font-mono text-xs text-foreground">{params.row.id}</span>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Fecha',
      width: 120,
      sortable: true,
      filterable: true,
      renderCell: (params: RenderCellParams) => (
        <span className="text-sm">{formatAuditDate(params.row.createdAt)}</span>
      ),
    },
    {
      field: 'type',
      headerName: 'Tipo',
      width: 180,
      sortable: true,
      filterable: true,
      renderCell: (params: RenderCellParams) => (
        <span className="text-sm font-medium">{params.row.type}</span>
      ),
    },
    {
      field: 'direction',
      headerName: 'Flujo',
      width: 100,
      sortable: true,
      filterable: true,
      renderCell: (params: RenderCellParams) => (
        <span className={`text-sm font-medium ${params.row.direction === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
          {params.row.direction === 'IN' ? 'Entrada' : 'Salida'}
        </span>
      ),
    },
    {
      field: 'amount',
      headerName: 'Cantidad',
      width: 100,
      align: 'right',
      sortable: true,
      filterable: true,
      renderCell: (params: RenderCellParams) => (
        <span className="text-sm font-semibold">{currencyFormatter.format(params.row.amount)}</span>
      ),
    },
    {
      field: 'trayName',
      headerName: 'Bandeja',
      width: 150,
      sortable: true,
      filterable: true,
      renderCell: (params: RenderCellParams) => (
        <span className="text-sm">{params.row.trayName}</span>
      ),
    },
    {
      field: 'counterpartyName',
      headerName: 'Contraparte',
      width: 180,
      sortable: true,
      filterable: true,
      renderCell: (params: RenderCellParams) => (
        <span className="text-sm">{params.row.counterpartyName}</span>
      ),
    },
    {
      field: 'reason',
      headerName: 'Motivo',
      width: 150,
      sortable: true,
      filterable: true,
      renderCell: (params: RenderCellParams) => (
        <span className="text-sm">{params.row.reason || '—'}</span>
      ),
    },
    {
      field: 'performedByName',
      headerName: 'Realizado por',
      width: 150,
      sortable: true,
      filterable: true,
      renderCell: (params: RenderCellParams) => (
        <span className="text-sm">{params.row.performedByName}</span>
      ),
    },
    {
      field: 'stockBefore',
      headerName: 'Stock Anterior',
      width: 120,
      align: 'right',
      renderCell: (params: RenderCellParams) => (
        <span className="text-sm font-mono">
          {params.row.stockBefore !== undefined ? params.row.stockBefore.toLocaleString('es-CL') : '—'}
        </span>
      ),
    },
    {
      field: 'stockAfter',
      headerName: 'Stock Nuevo',
      width: 120,
      align: 'right',
      renderCell: (params: RenderCellParams) => (
        <span className="text-sm font-mono">
          {params.row.stockAfter !== undefined ? params.row.stockAfter.toLocaleString('es-CL') : '—'}
        </span>
      ),
    },
  ], []);

  return (
    <DataGrid
      columns={columns}
      rows={data}
      totalRows={totalRows}
      limit={currentLimit}
      search={currentSearch}
      filters={currentFilters}
      sort={currentSort?.toLowerCase() as 'asc' | 'desc' | undefined}
      sortField={currentSortField}
      fillViewport
      fillViewportInTabLayout
      showBorder={false}
    />
  );
}