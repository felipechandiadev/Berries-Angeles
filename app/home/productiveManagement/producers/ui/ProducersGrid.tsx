'use client';

import DataGrid from '@/app/baseComponents/DataGrid/DataGrid';
import CreateProducerButton from './CreateProducerButton';
import UpdateProducerButton from './UpdateProducerButton';
import DeleteProducerButton from './DeleteProducerButton';
import { useRouter, useSearchParams } from 'next/navigation';
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
}

export default function ProducersGrid({ initialData }: ProducersGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();
  const [isExporting, setIsExporting] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      showAlert({ message: 'Preparing export...', type: 'info', duration: 3000 });

      const search = searchParams.get('search') || undefined;
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = (searchParams.get('sortOrder') || 'DESC') as 'ASC' | 'DESC';

      const exportInput: GetProducersGridDataInput = {
        search,
        sortBy,
        sortOrder,
      };

      const result = await getProducersExportData(exportInput);

      if (!result.success) {
        showAlert({
          message: result.error || 'Error exporting',
          type: 'error',
          duration: 5000
        });
        return;
      }

      if (!result.data || result.data.length === 0) {
        showAlert({
          message: 'No data to export',
          type: 'warning',
          duration: 4000
        });
        return;
      }

      const exportResult = exportProducersToExcel(result.data);

      if (exportResult.success) {
        showAlert({
          message: `${exportResult.recordCount} records exported successfully`,
          type: 'success',
          duration: 4000
        });
      } else {
        showAlert({
          message: `Error generating Excel: ${exportResult.error}`,
          type: 'error',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showAlert({
        message: 'Unexpected error during export',
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
      flex: 1.2,
      sortable: true,
    },
    {
      field: 'dni',
      headerName: 'DNI',
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
      renderCell: ({ row }: { row: any }) => row.productiveUnit?.name || '-',
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      flex: 0.6,
      sortable: false,
      actionComponent: ({ row }: { row: Producer }) => (
        <div className="flex gap-1">
          <UpdateProducerButton producer={row} onSuccess={handleRefresh} />
          <DeleteProducerButton producer={row} onSuccess={handleRefresh} />
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <DataGrid
        columns={columns}
        rows={initialData.data}
        limit={initialData.limit}
        totalRows={initialData.totalRecords}
        onExportExcel={handleExportExcel}
        createForm={<CreateProducerButton onSuccess={handleRefresh} />}
        height={'85vh'}
      />
    </div>
  );
}
