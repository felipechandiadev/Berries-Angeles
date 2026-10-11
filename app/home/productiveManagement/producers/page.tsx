import React, { Suspense } from 'react';
import { BasicPageLayout } from '@felipechandiadev/ui';
import DotProgress from '@/app/baseComponents/DotProgress/DotProgress';
import { getProducersGridData } from '../../../actions/producers';
import { WithNavSearch } from '@/app/ui/WithNavSearch';
import ProducersGrid from './ui/ProducersGrid';

interface ProducersPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    sort?: string;
    sortField?: string;
    search?: string;
    filters?: string;
  }>;
}

export default async function ProducersPage({ searchParams }: ProducersPageProps) {
  const params = await searchParams;
  
  const page = params.page ? parseInt(params.page) : 1;
  const limit = params.limit ? parseInt(params.limit) : 25;
  const sortBy = params.sortField || 'createdAt';
  const sortOrder = (params.sort as 'ASC' | 'DESC') || 'DESC';
  const search = params.search || '';
  const filters = params.filters || '';

  const gridData = await getProducersGridData({
    page,
    limit,
    sortBy,
    sortOrder,
    search,
    columnFilters: filters,
  });

  const navSearch = new URLSearchParams();
  navSearch.set('page', String(page));
  navSearch.set('limit', String(limit));
  if (sortBy) navSearch.set('sortField', sortBy);
  if (sortOrder) navSearch.set('sort', sortOrder);
  if (search) navSearch.set('search', search);
  if (filters) navSearch.set('filters', filters);

  return (
    <BasicPageLayout title="Productores" data-test-id="producers-page">
      <Suspense fallback={<DotProgress size={16} />}>
        <WithNavSearch search={navSearch.toString()}>
          <ProducersGrid initialData={gridData} />
        </WithNavSearch>
      </Suspense>
    </BasicPageLayout>
  );
}

