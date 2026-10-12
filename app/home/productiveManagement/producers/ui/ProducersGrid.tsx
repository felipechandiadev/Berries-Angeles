'use client';

import { DataGridTable as DataGrid } from '@felipechandiadev/ui';
import CreateProducerButton from './CreateProducerButton';
import UpdateProducerButton from './UpdateProducerButton';
import DeleteProducerButton from './DeleteProducerButton';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { getProducersExportData, GetProducersGridDataInput } from '@/app/actions/producers';
import { exportProducersToExcel } from '@/lib/excelExport';
import { useAlert } from '@/app/state/contexts/AlertContext';

interface Producer {
  id: string;
  name: string;
  dni: string;
  mail: string;
  phone: string;
  productiveUnitId: string;
  productiveUnit?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface ProducersGridProps {
  initialData: {
    success: boolean;
    data: Producer[];
    totalRecords: number;
    page: number;
    limit: number;
    totalPages: number;
    error?: string;
  };
  currentLimit: number;
  currentSort?: 'ASC' | 'DESC';
  currentSortField?: string;
  currentSearch?: string;
  currentFilters?: string;
}

export default function ProducersGrid({
  initialData,
  currentLimit,
  currentSort,
  currentSortField,
  currentSearch,
  currentFilters,
}: ProducersGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();
  const [isExporting, setIsExporting] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleViewDetail = (producerId: string) => {
    const returnTo = `${pathname}?${searchParams.toString()}`;
    router.push(
      `/home/productiveManagement/producers/${producerId}?returnTo=${encodeURIComponent(returnTo)}`,
    );
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      showAlert({ message: 'Preparando exportación...', type: 'info', duration: 3000 });

      const search = searchParams.get('search') || undefined;
      const columnFilters = searchParams.get('filters') || undefined;
      const filtration = searchParams.get('filtration') === 'true';
      const sortBy = searchParams.get('sortField') || searchParams.get('sortBy') || 'createdAt';
      const sortOrder = (
        searchParams.get('sort') ||
        searchParams.get('sortOrder') ||
        'DESC'
      ).toUpperCase() as 'ASC' | 'DESC';

      const exportInput: GetProducersGridDataInput = {
        search,
        columnFilters,
        filtration,
        sortBy,
        sortOrder,
      };

      const result = await getProducersExportData(exportInput);

      if (!result.success) {
        showAlert({
          message: result.error || 'Error al exportar',
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

      const exportResult = exportProducersToExcel(result.data);

      if (exportResult.success) {
        showAlert({
          message: `${exportResult.recordCount} registros exportados`,
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
      console.error('Error exporting to Excel:', error);
      showAlert({
        message: 'Error inesperado al exportar',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Nombre',
      flex: 1.2,
      sortable: true,
    },
    {
      field: 'dni',
      headerName: 'RUT',
      flex: 1,
      sortable: true,
    },
    {
      field: 'mail',
      headerName: 'Correo',
      flex: 1.5,
      sortable: true,
    },
    {
      field: 'phone',
      headerName: 'Teléfono',
      flex: 1,
      sortable: true,
    },
    {
      field: 'productiveUnitName',
      headerName: 'Unidad Productiva',
      flex: 1.3,
      sortable: false,
      filterable: true,
      renderCell: ({ row }: { row: any }) => row.productiveUnit?.name || '-',
    },
    {
      field: 'actions',
      headerName: '',
      flex: 0.8,
      sortable: false,
      filterable: false,
      actionComponent: ({ row }: { row: Producer }) => (
        <div className="flex items-center gap-1">
          <IconButton
            icon="more_horiz"
            variant="basicSecondary"
            size="xs"
            title="Ver detalle"
            ariaLabel="Ver detalle del productor"
            onClick={() => handleViewDetail(row.id)}
          />
          <UpdateProducerButton producer={row} onSuccess={handleRefresh} />
          <DeleteProducerButton producer={row} onSuccess={handleRefresh} />
        </div>
      ),
    },
  ];

  return (
    <DataGrid
      title="Productores"
      columns={columns}
      rows={initialData.data}
      limit={currentLimit}
      totalRows={initialData.totalRecords}
      onExportExcel={isExporting ? undefined : handleExportExcel}
      sort={currentSort?.toLowerCase() as 'asc' | 'desc' | undefined}
      sortField={currentSortField}
      search={currentSearch}
      filters={currentFilters}
      createForm={<CreateProducerButton onSuccess={handleRefresh} />}
      createFormTitle="Crear productor"
      height="85vh"
      showBorder={false}
    />
  );
}
