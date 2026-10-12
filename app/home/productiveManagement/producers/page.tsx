import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import DotProgress from '@/app/baseComponents/DotProgress/DotProgress';
import { getProducersGridData } from '../../../actions/producers';
import { WithNavSearch } from '@/app/ui/WithNavSearch';
import ProducersGrid from './ui/ProducersGrid';

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

interface ProducersPageProps {
  searchParams?: Promise<PageSearchParams>;
}

export default async function ProducersPage({ searchParams }: ProducersPageProps) {
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
    redirect(`/home/productiveManagement/producers?${query.toString()}`);
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

  const gridData = await getProducersGridData({
    page,
    limit,
    sortBy,
    sortOrder,
    search,
    columnFilters: filters,
    filtration,
  });

  const navSearch = new URLSearchParams();
  navSearch.set('page', String(page));
  navSearch.set('limit', String(limit));
  if (sortBy) navSearch.set('sortField', sortBy);
  if (sortOrder) navSearch.set('sort', sortOrder);
  if (search) navSearch.set('search', search);
  if (filters) navSearch.set('filters', filters);
  if (filtration) navSearch.set('filtration', 'true');

  return (
    <div data-test-id="producers-page">
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <DotProgress />
          </div>
        }
      >
        <WithNavSearch search={navSearch.toString()}>
          <ProducersGrid
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
