"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DataGrid from '@/app/baseComponents/DataGrid/DataGrid';
import { useAlert } from '@/app/state/contexts/AlertContext';
import {
  getReceptionsExportData,
  getReceptionPrintData,
  type ReceptionGridRow,
  type ReceptionsGridFilters,
} from '@/app/actions/receptions';
import { exportReceptionsToExcel } from '@/lib/excelExport';
import { formatAuditDate } from '@/lib/dateTimeUtils';
import DetailReceptionButton from './DetailReceptionButton';
import DeleteReceptionButton from './DeleteReceptionButton';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import Badge from '@/app/baseComponents/Badge/Badge';
import PrintReceptionDialog from '@/app/home/receptions/newRecepcion/ui/PrintReceptionDialog';
import type { ReceptionDataSnapshot } from '@/app/home/receptions/newRecepcion/ui/TransactionData';
import { paymentStatusLabel } from '@/lib/receptionPayment';

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
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printSnapshot, setPrintSnapshot] = useState<ReceptionDataSnapshot | null>(null);
  const [printReceptionId, setPrintReceptionId] = useState<string | null>(null);
  const [loadingPrintId, setLoadingPrintId] = useState<string | null>(null);

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

  const handleOpenPrintDialog = async (reception: ReceptionGridRow) => {
    const receptionId = String(reception.id);

    if (loadingPrintId) {
      return;
    }

    setPrintSnapshot(null);
    setPrintReceptionId(null);
    setLoadingPrintId(receptionId);

    try {
      const result = await getReceptionPrintData(receptionId);

      if (!result.success || !result.data) {
        showAlert({
          message: result.error || 'No fue posible preparar el recibo de impresión.',
          type: 'error',
          duration: 5000,
        });
        return;
      }

      setPrintSnapshot(result.data.snapshot as ReceptionDataSnapshot);
      setPrintReceptionId(result.data.receptionTransactionId ?? receptionId);
      setPrintDialogOpen(true);
    } catch (error) {
      console.error('[ReceptionsGrid] Error loading print data:', error);
      showAlert({
        message: 'Error inesperado al preparar la impresión de la recepción.',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setLoadingPrintId((current) => (current === receptionId ? null : current));
    }
  };

  const handleClosePrintDialog = () => {
    setPrintDialogOpen(false);
  };

  const columns = [
    {
      field: 'id',
      headerName: 'Folio',
      flex: 0.3,
      sortable: true,
      filterable: true,
      renderCell: ({ value }: { value: string | number }) => (
        <span className="font-mono text-xs truncate">{value ?? '—'}</span>
      ),
    },
    {
      field: 'producerName',
      headerName: 'Productor',
      flex: 1.8,
      sortable: true,
      filterable: true,
    },
    {
      field: 'guideNumber',
      headerName: 'Guía',
      flex: 0.7,
      sortable: true,
      filterable: true,
      renderCell: ({ value }: { value: string }) => (
        <span>{value && value.trim() ? value : '—'}</span>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Fecha/Hora',
      flex: 0.8,
      sortable: true,
      filterable: true,
      renderCell: ({ value }: { value: string }) => (
        <span>{value ? formatAuditDate(value) : '—'}</span>
      ),
    },
    {
      field: 'varieties',
      headerName: 'Variedad',
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: ({ value }: { value: string[] }) => (
        <span className="truncate">{Array.isArray(value) && value.length ? value.join(', ') : '—'}</span>
      ),
    },
    {
      field: 'formats',
      headerName: 'Formato',
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: ({ value }: { value: string[] }) => (
        <span className="truncate">{Array.isArray(value) && value.length ? value.join(', ') : '—'}</span>
      ),
    },
    {
      field: 'totalTrays',
      headerName: 'Bandejas',
      flex: 0.7,
      sortable: true,
      filterable: false,
      align: 'left' as const,
      renderCell: ({ value }: { value: number }) => (
        <span>{numberFormatter.format(Number(value) || 0)}</span>
      ),
    },
    {
      field: 'grossWeightKg',
      headerName: 'Bruto (kg)',
      flex: 0.7,
      sortable: true,
      filterable: false,
      align: 'left' as const,
      renderCell: ({ value }: { value: number }) => (
        <span>{numberFormatter.format(Number(value) || 0)}</span>
      ),
    },
    {
      field: 'netWeightKg',
      headerName: 'Neto (kg)',
      flex: 0.7,
      sortable: true,
      filterable: false,
      align: 'left' as const,
      renderCell: ({ value }: { value: number }) => (
        <span>{numberFormatter.format(Number(value) || 0)}</span>
      ),
    },
    {
      field: 'paymentSummary',
      headerName: 'A PAGAR',
      flex: 1,
      sortable: false,
      filterable: false,
      align: 'left' as const,
      renderCell: ({ row }: { row: ReceptionGridRow }) => (
        <div className="py-1 space-y-0.5 text-xs">
          <div className="flex justify-between gap-2">
            <span className="text-gray-600">CLP:</span>
            <span className="font-medium">{currencyFormatter.format(Number(row.payableCLP) || 0)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-600">USD:</span>
            <span className="font-medium">{usdFormatter.format(Number(row.payableUSD) || 0)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-600">Cambio:</span>
            <span className="font-medium">{numberFormatter.format(Number(row.exchangeRate) || 0)}</span>
          </div>
          <div className="flex justify-between gap-2 border-t pt-0.5">
            <span className="text-gray-800 font-semibold">Total:</span>
            <span className="font-bold text-green-700">{currencyFormatter.format(Number(row.totalCLP) || 0)}</span>
          </div>
        </div>
      ),
    },
    {
      field: 'paymentStatus',
      headerName: 'Estado',
      flex: 0.8,
      sortable: false,
      filterable: false,
      renderCell: ({ value }: { value: string }) => {
        const label = paymentStatusLabel(value);
        const isPaid = value === 'PAID_ON_RECEPTION';
        return isPaid ? (
          <Badge variant="success">{label}</Badge>
        ) : (
          <Badge variant="warning">{label}</Badge>
        );
      },
    },
    {
      field: 'actions',
      headerName: '',
      flex: 0.8,
      sortable: false,
      filterable: false,
      actionComponent: ({ row }: { row: ReceptionGridRow }) => (
        <div className="flex gap-1">
          <DetailReceptionButton reception={row} />
          <IconButton
            icon={loadingPrintId === String(row.id) ? 'hourglass_top' : 'print'}
            variant="basicSecondary"
            size="xs"
            title="Reimprimir ticket"
            ariaLabel="Reimprimir ticket de recepción"
            disabled={loadingPrintId === String(row.id)}
            onClick={() => handleOpenPrintDialog(row)}
          />
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

      <PrintReceptionDialog
        open={printDialogOpen}
        onClose={handleClosePrintDialog}
        snapshot={printSnapshot}
        receptionTransactionId={printReceptionId}
      />
    </div>
  );
}
