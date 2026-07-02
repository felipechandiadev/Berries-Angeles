"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DataGrid from '@/app/baseComponents/DataGrid/DataGrid';
import { useAlert } from '@/app/state/contexts/AlertContext';
import {
  getReceptionsExportData,
  type ReceptionGridRow,
  type ReceptionsGridFilters,
} from '@/app/actions/receptions';
import { exportReceptionsToExcel } from '@/lib/excelExport';
import { formatAuditDate } from '@/lib/dateTimeUtils';
import DetailReceptionButton from './DetailReceptionButton';
import DeleteReceptionButton from './DeleteReceptionButton';

type SortDirection = 'ASC' | 'DESC';

const numberFormatter = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

interface ReceptionsGridProps {
  initialData: ReceptionGridRow[];
  totalRows: number;
  currentLimit: number;
  currentSort?: SortDirection;
  currentSortField?: string;
  currentSearch?: string;
  currentFilters?: string;
}

export default function ReceptionsGrid({
  initialData,
  totalRows,
  currentLimit,
  currentSort,
  currentSortField,
  currentSearch,
  currentFilters,
}: ReceptionsGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();
  const [isExporting, setIsExporting] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleExportExcel = async () => {
    if (isExporting) {
      return;
    }

    try {
      setIsExporting(true);
      showAlert({ message: 'Preparando exportación...', type: 'info', duration: 3000 });

      const search = searchParams.get('search') || undefined;
      const filtersParam = searchParams.get('filters') || undefined;
      const sortField = searchParams.get('sortField') || currentSortField || 'createdAt';
      const sort = (searchParams.get('sort') || currentSort || 'desc').toString();

      const exportFilters: ReceptionsGridFilters = {
        search,
        filters: filtersParam,
        sortBy: sortField,
        sortOrder: sort.toLowerCase() as 'asc' | 'desc',
        filtration: !!filtersParam,
      };

      const result = await getReceptionsExportData(exportFilters);

      if (!result.success) {
        showAlert({
          message: result.error || 'Error al exportar recepciones',
          type: 'error',
          duration: 5000,
        });
        return;
      }

      if (!result.data || result.data.length === 0) {
        showAlert({
          message: 'No hay datos para exportar',
          type: 'warning',
          duration: 4000,
        });
        return;
      }

      const exportResult = exportReceptionsToExcel(result.data);

      if (exportResult.success) {
        showAlert({
          message: `Exportados ${exportResult.recordCount} registros exitosamente`,
          type: 'success',
          duration: 4000,
        });
      } else {
        showAlert({
          message: `Error al generar Excel: ${exportResult.error}`,
          type: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error exporting receptions to Excel:', error);
      showAlert({
        message: 'Error inesperado al exportar recepciones',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    {
      field: 'id',
      headerName: 'Folio',
      flex: 0.6,
      sortable: true,
      renderCell: ({ value }: { value: string | number }) => (
        <span className="font-mono text-xs truncate">{value ?? '—'}</span>
      ),
    },
    {
      field: 'producerName',
      headerName: 'Productor',
      flex: 1.2,
      sortable: true,
    },
    {
      field: 'guideNumber',
      headerName: 'Guía',
      flex: 0.8,
      sortable: true,
      renderCell: ({ value }: { value: string }) => (
        <span>{value && value.trim() ? value : '—'}</span>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Fecha/Hora',
      flex: 1,
      sortable: true,
      renderCell: ({ value }: { value: string }) => (
        <span>{value ? formatAuditDate(value) : '—'}</span>
      ),
    },
    {
      field: 'varieties',
      headerName: 'Variedades',
      flex: 1.5,
      sortable: false,
      renderCell: ({ value }: { value: string[] }) => (
        <span className="truncate">{Array.isArray(value) && value.length ? value.join(', ') : '—'}</span>
      ),
    },
    {
      field: 'totalTrays',
      headerName: 'Bandejas',
      flex: 0.7,
      sortable: true,
      align: 'left' as const,
      renderCell: ({ value }: { value: number }) => (
        <span>{numberFormatter.format(Number(value) || 0)}</span>
      ),
    },
    {
      field: 'grossWeightKg',
      headerName: 'Peso bruto (kg)',
      flex: 0.9,
      sortable: true,
      align: 'left' as const,
      renderCell: ({ value }: { value: number }) => (
        <span>{numberFormatter.format(Number(value) || 0)}</span>
      ),
    },
    {
      field: 'netWeightKg',
      headerName: 'Peso neto (kg)',
      flex: 0.9,
      sortable: true,
      align: 'left' as const,
      renderCell: ({ value }: { value: number }) => (
        <span>{numberFormatter.format(Number(value) || 0)}</span>
      ),
    },
    {
      field: 'payableCLP',
      headerName: 'CLP',
      flex: 1,
      sortable: true,
      align: 'left' as const,
      renderCell: ({ value }: { value: number }) => (
        <span>{currencyFormatter.format(Number(value) || 0)}</span>
      ),
    },
    {
      field: 'payableUSD',
      headerName: 'USD',
      flex: 0.9,
      sortable: true,
      align: 'left' as const,
      renderCell: ({ value }: { value: number }) => (
        <span>{usdFormatter.format(Number(value) || 0)}</span>
      ),
    },
    {
      field: 'exchangeRate',
      headerName: 'Cambio',
      flex: 0.8,
      sortable: true,
      align: 'left' as const,
      renderCell: ({ value }: { value: number }) => (
        <span>{numberFormatter.format(Number(value) || 0)}</span>
      ),
    },
    {
      field: 'totalCLP',
      headerName: 'A PAGAR',
      flex: 1,
      sortable: true,
      align: 'left' as const,
      renderCell: ({ value }: { value: number }) => (
        <span>{currencyFormatter.format(Number(value) || 0)}</span>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      flex: 0.6,
      sortable: false,
      actionComponent: ({ row }: { row: ReceptionGridRow }) => (
        <div className="flex gap-1">
          <DetailReceptionButton reception={row} />
          <DeleteReceptionButton reception={row} onSuccess={handleRefresh} />
        </div>
      ),
    },
  ];

  return (
    <div >
      <DataGrid
        columns={columns}
        rows={initialData}
        limit={currentLimit}
        totalRows={totalRows}
        onExportExcel={handleExportExcel}
        sort={currentSort?.toLowerCase() as 'asc' | 'desc' | undefined}
        sortField={currentSortField}
        search={currentSearch}
        filters={currentFilters}
        height={'85vh'}
        showBorder={false}
      />
    </div>
  );
}
