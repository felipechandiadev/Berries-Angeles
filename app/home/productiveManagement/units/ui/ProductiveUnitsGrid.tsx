'use client';

import DataGrid from '@/app/baseComponents/DataGrid/DataGrid';
import CreateUnitButton from './CreateUnitButton';
import UpdateUnitButton from './UpdateUnitButton';
import DeleteUnitButton from './DeleteUnitButton';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { getProductiveUnitsExportData, ProductiveUnitsGridFilters } from '@/app/actions/productiveUnits';
import { exportProductiveUnitsToExcel } from '@/lib/excelExport';
import { useAlert } from '@/app/state/contexts/AlertContext';

interface ProductiveUnit {
  id: string;
  name: string;
  address?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductiveUnitsGridProps {
  initialData: ProductiveUnit[];
  totalRows: number;
  currentPage: number;
  currentLimit: number;
  currentSort?: 'ASC' | 'DESC';
  currentSortField?: string;
  currentSearch?: string;
  currentFilters?: string;
}

export default function ProductiveUnitsGrid({ 
  initialData,
  totalRows,
  currentPage,
  currentLimit,
  currentSort,
  currentSortField,
  currentSearch,
  currentFilters
}: ProductiveUnitsGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();
  const [isExporting, setIsExporting] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  /**
   * Manejador para exportar unidades productivas a Excel
   * Recopila filtros actuales y llama a la server action
   */
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      showAlert({ message: 'Preparando exportación...', type: 'info', duration: 3000 });

      // Recopilar parámetros de filtros desde URL
      const search = searchParams.get('search') || undefined;
      const filters_param = searchParams.get('filters') || undefined;
      const sortField = searchParams.get('sortField') || 'name';
      const sort = searchParams.get('sort') || 'asc';

      // Preparar objeto de filtros
      const exportFilters: ProductiveUnitsGridFilters = {
        search,
        filters: filters_param,
        sortBy: sortField,
        sortOrder: (sort.toLowerCase() as 'asc' | 'desc') || 'asc',
        filtration: !!filters_param,
      };

      // Llamar server action para obtener datos
      const result = await getProductiveUnitsExportData(exportFilters);

      if (!result.success) {
        showAlert({ 
          message: result.error || 'Error al exportar', 
          type: 'error', 
          duration: 5000 
        });
        return;
      }

      if (!result.data || result.data.length === 0) {
        showAlert({ 
          message: 'No hay datos para exportar', 
          type: 'warning', 
          duration: 4000 
        });
        return;
      }

      // Exportar a Excel (lado del cliente)
      const exportResult = exportProductiveUnitsToExcel(result.data);

      if (exportResult.success) {
        showAlert({ 
          message: `Exportados ${exportResult.recordCount} registros exitosamente`, 
          type: 'success', 
          duration: 4000 
        });
      } else {
        showAlert({ 
          message: `Error al generar Excel: ${exportResult.error}`, 
          type: 'error', 
          duration: 5000 
        });
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showAlert({ 
        message: 'Error inesperado al exportar', 
        type: 'error', 
        duration: 5000 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Nombre',
      flex: 1.5,
      sortable: true,
    },
    {
      field: 'address',
      headerName: 'Dirección',
      flex: 1.5,
      sortable: true,
    },
    {
      field: 'description',
      headerName: 'Descripción',
      flex: 2,
      sortable: true,
    },
    {
      field: 'actions',
      headerName: '',
      flex: 0.6,
      sortable: false,
      actionComponent: ({ row }: { row: ProductiveUnit }) => (
        <div className="flex gap-1">
          <UpdateUnitButton unit={row} onSuccess={handleRefresh} />
          <DeleteUnitButton unit={row} onSuccess={handleRefresh} />
        </div>
      ),
    },
  ];

  return (
  
      <DataGrid
        columns={columns}
        rows={initialData}
        limit={currentLimit}
        totalRows={totalRows}
        onExportExcel={handleExportExcel}
        createForm={<CreateUnitButton onSuccess={handleRefresh} />}
        sort={currentSort?.toLowerCase() as 'asc' | 'desc'}
        sortField={currentSortField}
        search={currentSearch}
        filters={currentFilters}
        height={'85vh'}
        showBorder={false}
      />
 
  );
}