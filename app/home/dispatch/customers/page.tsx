import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import DotProgress from '@/app/baseComponents/DotProgress/DotProgress';
import { getCustomersGridData } from '@/app/actions/customers';
import { WithNavSearch } from '@/app/ui/WithNavSearch';
import { buildGridNavSearch } from '@/lib/gridQuery';
import CustomersGrid from './ui/CustomersGrid';

export const dynamic = 'force-dynamic';

interface PageSearchParams {
  page?: string;
  limit?: string;
  sort?: string;
  sortField?: string;
  search?: string;
  filtration?: string;
  filters?: string;
}

interface CustomersPageProps {
  searchParams?: Promise<PageSearchParams>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = searchParams ? await searchParams : undefined;

  const needsRedirect = !params?.page || !params?.limit;
  if (needsRedirect) {
    const query = new URLSearchParams();
    if (params?.sort) query.set('sort', params.sort);
    if (params?.sortField) query.set('sortField', params.sortField);
    if (params?.search) query.set('search', params.search);
    if (params?.filtration) query.set('filtration', params.filtration);
    if (params?.filters) query.set('filters', params.filters);
    query.set('page', params?.page || '1');
    query.set('limit', params?.limit || '25');
    redirect(`/home/dispatch/customers?${query.toString()}`);
  }

  const page = parseInt(params?.page || '1', 10) || 1;
  const limit = parseInt(params?.limit || '25', 10) || 25;
  const sortBy = typeof params?.sortField === 'string' ? params.sortField : undefined;
  const sortOrder =
    params?.sort === 'asc' || params?.sort === 'ASC'
      ? 'ASC'
      : params?.sort === 'desc' || params?.sort === 'DESC'
        ? 'DESC'
        : undefined;
  const search = typeof params?.search === 'string' ? params.search : '';
  const filters = typeof params?.filters === 'string' ? params.filters : '';
  const filtration = params?.filtration === 'true';

  const gridData = await getCustomersGridData({
    page,
    limit,
    sortBy,
    sortOrder,
    search,
    columnFilters: filters,
    filtration,
  });

  if (!gridData.success) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-foreground">Error al cargar clientes</h2>
          <p className="text-secondary">{gridData.error}</p>
        </div>
      </div>
    );
  }

  const navSearch = buildGridNavSearch({
    page,
    limit,
    search,
    filtration,
    filters,
    sortField: sortBy,
    sort: sortOrder,
  });

  return (
    <div data-test-id="customers-page">
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <DotProgress />
          </div>
        }
      >
        <WithNavSearch search={navSearch}>
          <CustomersGrid
            initialData={gridData}
            currentLimit={limit}
            currentSort={sortOrder}
            currentSortField={sortBy}
            currentSearch={search}
            currentFilters={filters}
          />
        </WithNavSearch>
      </Suspense>
    </div>
  );
}
