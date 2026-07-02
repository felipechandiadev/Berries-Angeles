'use client';

// Tray movements DataGrid component

import { useMemo } from 'react';
import DataGrid, { DataGridColumn } from '@/app/baseComponents/DataGrid/DataGrid';
import { formatAuditDate } from '@/lib/dateTimeUtils';
import type { TrayTransactionRow } from '@/app/actions/transactions';

interface TrayMovementsDataGridProps {
  data: TrayTransactionRow[];
}

interface RenderCellParams {
  row: TrayTransactionRow;
}

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function TrayMovementsDataGrid({ data }: TrayMovementsDataGridProps) {
  const columns: DataGridColumn[] = useMemo(() => [
    {
      field: 'id',
      headerName: 'Folio',
      width: 80,
      renderCell: (params: RenderCellParams) => (
        <span className="font-mono text-xs text-foreground">{params.row.id}</span>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Fecha',
      width: 120,
      renderCell: (params: RenderCellParams) => (
        <span className="text-sm">{formatAuditDate(params.row.createdAt)}</span>
      ),
    },
    {
      field: 'type',
      headerName: 'Tipo',
      width: 180,
      renderCell: (params: RenderCellParams) => (
        <span className="text-sm font-medium">{params.row.type}</span>
      ),
    },
    {
      field: 'direction',
      headerName: 'Flujo',
      width: 100,
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
      renderCell: (params: RenderCellParams) => (
        <span className="text-sm font-semibold">{currencyFormatter.format(params.row.amount)}</span>
      ),
    },
    {
      field: 'trayName',
      headerName: 'Bandeja',
      width: 150,
      renderCell: (params: RenderCellParams) => (
        <span className="text-sm">{params.row.trayName}</span>
      ),
    },
    {
      field: 'counterpartyName',
      headerName: 'Contraparte',
      width: 180,
      renderCell: (params: RenderCellParams) => (
        <span className="text-sm">{params.row.counterpartyName}</span>
      ),
    },
    {
      field: 'reason',
      headerName: 'Motivo',
      width: 150,
      renderCell: (params: RenderCellParams) => (
        <span className="text-sm">{params.row.reason || '—'}</span>
      ),
    },
    {
      field: 'performedByName',
      headerName: 'Realizado por',
      width: 150,
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

  if (!data.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-secondary">
        <p>No se encontraron movimientos de bandejas.</p>
      </div>
    );
  }

  return (
    <DataGrid
      columns={columns}
      rows={data}
      height="70vh"
      showBorder={false}
    />
  );
}