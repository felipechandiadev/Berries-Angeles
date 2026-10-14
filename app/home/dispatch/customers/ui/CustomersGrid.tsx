'use client';

import { DataGridTable as DataGrid } from '@felipechandiadev/ui';
import { useRouter } from 'next/navigation';
import CreateCustomerButton from './CreateCustomerButton';
import UpdateCustomerButton from './UpdateCustomerButton';
import DeleteCustomerButton from './DeleteCustomerButton';

interface CustomerRow {
  id: string;
  name: string;
  dni: string;
  mail: string;
  phone: string;
  personId: string;
}

interface CustomersGridProps {
  initialData: {
    success: boolean;
    data: CustomerRow[];
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

export default function CustomersGrid({
  initialData,
  currentLimit,
  currentSort,
  currentSortField,
  currentSearch,
  currentFilters,
}: CustomersGridProps) {
  const customers = initialData.data;
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Nombre',
      flex: 1.4,
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
      flex: 1.4,
      sortable: true,
    },
    {
      field: 'phone',
      headerName: 'Teléfono',
      flex: 1,
      sortable: true,
    },
    {
      field: 'actions',
      headerName: '',
      flex: 0.6,
      sortable: false,
      filterable: false,
      actionComponent: ({ row }: { row: CustomerRow }) => (
        <div className="flex items-center gap-1">
          <UpdateCustomerButton customer={row} onSuccess={handleRefresh} />
          <DeleteCustomerButton customer={row} onSuccess={handleRefresh} />
        </div>
      ),
    },
  ];

  return (
    <DataGrid
      title="Clientes"
      columns={columns}
      rows={customers}
      limit={currentLimit}
      totalRows={initialData.totalRecords}
      search={currentSearch}
      filters={currentFilters}
      sort={currentSort?.toLowerCase() as 'asc' | 'desc' | undefined}
      sortField={currentSortField}
      createForm={<CreateCustomerButton onSuccess={handleRefresh} />}
      createFormTitle="Crear cliente"
      fillViewport
      showBorder={false}
    />
  );
}
