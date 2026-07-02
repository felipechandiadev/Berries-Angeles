'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DataGrid, { type DataGridColumn } from '@/app/baseComponents/DataGrid/DataGrid';
import { useAlert } from '@/app/state/contexts/AlertContext';
import { getPalletsExportData, type PalletGridFilters } from '@/app/actions/pallets';
import { exportPalletsToExcel } from '@/lib/excelExport';
import { formatAuditDateLocaleES } from '@/lib/dateTimeUtils';
import CreatePalletButton from './CreatePalletButton';
import UpdatePalletButton from './UpdatePalletButton';
import DeletePalletButton from './DeletePalletButton';
import PalletStatusBadge, { getPalletStatusLabel } from './PalletStatusBadge';
import type { PalletRow } from './types';
import { PalletStatus } from '@/data/entities/Pallet';

interface PalletsGridProps {
  initialData: PalletRow[];
  totalRows: number;
  currentPage: number;
  currentLimit: number;
  currentSort?: 'ASC' | 'DESC';
  currentSortField?: string;
  currentSearch?: string;
  currentFilters?: string;
}

const integerFormatter = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const weightFormatter = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export default function PalletsGrid({
  initialData,
  totalRows,
  currentPage: _currentPage,
  currentLimit,
  currentSort,
  currentSortField,
  currentSearch,
  currentFilters,
}: PalletsGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();
  const [isExporting, setIsExporting] = useState(false);

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleExportExcel = useCallback(async () => {
    if (isExporting) {
      return;
    }

    try {
      setIsExporting(true);
      showAlert({ message: 'Preparando exportación...', type: 'info', duration: 3000 });

      const search = searchParams.get('search') || undefined;
      const filtersParam = searchParams.get('filters') || undefined;
      const sortField = searchParams.get('sortField') || 'createdAt';
      const sort = (searchParams.get('sort') || 'desc').toLowerCase() as 'asc' | 'desc';
      const filtration = searchParams.get('filtration') === 'true';

      const exportFilters: PalletGridFilters = {
        search,
        filters: filtersParam,
        sortBy: sortField,
        sortOrder: sort,
        filtration,
      };

      const result = await getPalletsExportData(exportFilters);

      if (!result.success) {
        showAlert({ message: result.error || 'Error al exportar', type: 'error', duration: 5000 });
        return;
      }

      if (!result.data || result.data.length === 0) {
        showAlert({ message: 'No hay datos para exportar', type: 'warning', duration: 4000 });
        return;
      }

      const exportResult = exportPalletsToExcel(result.data);

      if (exportResult.success) {
        showAlert({
          message: `Exportados ${exportResult.recordCount} pallets exitosamente`,
          type: 'success',
          duration: 4000,
        });
      } else {
        showAlert({ message: exportResult.error || 'Error al generar Excel', type: 'error', duration: 5000 });
      }
    } catch (error) {
      console.error('[PalletsGrid] Error exportando pallets:', error);
      showAlert({ message: 'Error inesperado al exportar', type: 'error', duration: 5000 });
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, searchParams, showAlert]);

  const columns: DataGridColumn[] = useMemo(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        flex: 0.9,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => <span className="font-mono text-xs truncate">{value ?? '-'}</span>,
      },
      {
        field: 'storageName',
        headerName: 'Almacenamiento',
        flex: 1.4,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => <span className="truncate">{value || '-'}</span>,
      },
      {
        field: 'trayName',
        headerName: 'Bandeja',
        flex: 1.2,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => <span className="truncate">{value || '-'}</span>,
      },
      {
        field: 'traysQuantity',
        headerName: 'Bandejas',
        type: 'number',
        align: 'right',
        headerAlign: 'right',
        flex: 0.7,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => <span>{integerFormatter.format(Number(value || 0))}</span>,
      },
      {
        field: 'capacity',
        headerName: 'Capacidad',
        type: 'number',
        align: 'right',
        headerAlign: 'right',
        flex: 0.7,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => <span>{integerFormatter.format(Number(value || 0))}</span>,
      },
      {
        field: 'weight',
        headerName: 'Peso inicial (kg)',
        type: 'number',
        align: 'right',
        headerAlign: 'right',
        flex: 0.9,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => <span>{weightFormatter.format(Number(value || 0))}</span>,
      },
      {
        field: 'dispatchWeight',
        headerName: 'Peso despacho (kg)',
        type: 'number',
        align: 'right',
        headerAlign: 'right',
        flex: 0.9,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => <span>{weightFormatter.format(Number(value || 0))}</span>,
      },
      {
        field: 'status',
        headerName: 'Estado',
        flex: 1,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => (
          <PalletStatusBadge status={(value as PalletStatus) ?? PalletStatus.AVAILABLE} />
        ),
      },
      {
        field: 'updatedAt',
        headerName: 'Actualizado',
        type: 'dateTime',
        flex: 1.2,
        sortable: true,
        filterable: true,
        renderCell: ({ value }) => (
          <span>{value ? formatAuditDateLocaleES(value as string) : '-'}</span>
        ),
      },
      {
        field: 'actions',
        headerName: '',
        flex: 0.7,
        sortable: false,
        actionComponent: ({ row }: { row: PalletRow }) => (
          <div className="flex gap-1">
            <UpdatePalletButton pallet={row} onSuccess={handleRefresh} />
            <DeletePalletButton pallet={row} onSuccess={handleRefresh} />
          </div>
        ),
      },
    ],
    [handleRefresh]
  );

  return (
  
      <DataGrid
        columns={columns}
        rows={initialData}
        limit={currentLimit}
        totalRows={totalRows}
        sort={currentSort?.toLowerCase() as 'asc' | 'desc' | undefined}
        sortField={currentSortField}
        search={currentSearch}
        filters={currentFilters}
        height={'85vh'}
        createForm={<CreatePalletButton onSuccess={handleRefresh} />}
        onExportExcel={handleExportExcel}
        title="Gestión de Pallets"
        showBorder={false}
      />

  );
}
