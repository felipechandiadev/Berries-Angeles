import { Suspense } from 'react';
import { BasicPageLayout } from '@felipechandiadev/ui';
import { getAuditGridData } from '../../actions/audits';
import { AuditDataGrid } from './ui/AuditDataGrid';
import DotProgress from '@/app/baseComponents/DotProgress/DotProgress';
import { WithNavSearch } from '@/app/ui/WithNavSearch';

export const dynamic = 'force-dynamic';

interface AuditPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function AuditLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-96">
      <DotProgress />
    </div>
  );
}

async function AuditContent({ params }: { params: Record<string, string | string[] | undefined> | undefined }) {
  const normalizedParams = params || {};
  const filters = {
    page: normalizedParams?.page
      ? parseInt(Array.isArray(normalizedParams.page) ? normalizedParams.page[0] : normalizedParams.page)
      : 1,
    limit: normalizedParams?.limit
      ? parseInt(Array.isArray(normalizedParams.limit) ? normalizedParams.limit[0] : normalizedParams.limit)
      : 25,
    search: Array.isArray(normalizedParams?.search) ? normalizedParams.search[0] : normalizedParams?.search,
    action: (Array.isArray(normalizedParams?.action) ? normalizedParams.action[0] : normalizedParams?.action) as '' | 'CREATE' | 'UPDATE' | 'DELETE' | undefined,
    entityName: Array.isArray(normalizedParams?.entityName)
      ? normalizedParams.entityName[0]
      : normalizedParams?.entityName,
    sortBy: Array.isArray(normalizedParams?.sortField) ? normalizedParams.sortField[0] : normalizedParams?.sortField || 'createdAt',
    sortOrder: (Array.isArray(normalizedParams?.sort) ? normalizedParams.sort[0] : normalizedParams?.sort) as 'asc' | 'desc' | undefined || 'desc',
    filters: Array.isArray(normalizedParams?.filters) ? normalizedParams.filters[0] : normalizedParams?.filters,
  };

  const auditData = await getAuditGridData(filters);
  const search = new URLSearchParams();
  search.set('page', String(filters.page));
  search.set('limit', String(filters.limit));
  if (filters.search) search.set('search', filters.search);
  if (filters.action) search.set('action', String(filters.action));
  if (filters.entityName) search.set('entityName', filters.entityName);
  if (filters.filters) search.set('filters', filters.filters);
  if (filters.sortBy) search.set('sortField', filters.sortBy);
  if (filters.sortOrder) search.set('sort', filters.sortOrder);

  return (
    <WithNavSearch search={search.toString()}>
      <AuditDataGrid
        {...auditData}
        filters={filters}
        currentSearch={filters.search || ''}
        currentFilters={filters.filters || ''}
        currentSort={filters.sortOrder}
        currentSortField={filters.sortBy}
      />
    </WithNavSearch>
  );
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams;

  return (
    <BasicPageLayout title="Auditoría" data-test-id="audit-page">
      <Suspense fallback={<AuditLoadingFallback />}>
        <AuditContent params={params} />
      </Suspense>
    </BasicPageLayout>
  );
}
