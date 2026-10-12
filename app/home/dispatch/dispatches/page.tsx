import { redirect } from 'next/navigation';
import { listDispatches } from '@/app/actions/dispatches';
import { WithNavSearch } from '@/app/ui/WithNavSearch';
import { buildGridNavSearch } from '@/lib/gridQuery';
import DispatchesGrid from './ui/DispatchesGrid';

export const dynamic = 'force-dynamic';

interface DispatchesSearchParams {
  page?: string;
  limit?: string;
  search?: string;
  filtration?: string;
  filters?: string;
  sort?: string;
  sortField?: string;
}

export default async function DispatchesPage({
  searchParams,
}: {
  searchParams?: Promise<DispatchesSearchParams>;
}) {
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
    redirect(`/home/dispatch/dispatches?${query.toString()}`);
  }

  const page = parseInt(params?.page || '1', 10) || 1;
  const limit = parseInt(params?.limit || '25', 10) || 25;
  const search = typeof params?.search === 'string' ? params.search : '';
  const filters = typeof params?.filters === 'string' ? params.filters : '';
  const filtration = params?.filtration === 'true';
  const sortField = typeof params?.sortField === 'string' ? params.sortField : undefined;
  const sort =
    params?.sort === 'asc' || params?.sort === 'ASC'
      ? 'ASC'
      : params?.sort === 'desc' || params?.sort === 'DESC'
        ? 'DESC'
        : undefined;

  const dispatchesList = await listDispatches({
    page,
    limit,
    search,
    filters,
    filtration,
    sortField,
    sort,
  });

  const navSearch = buildGridNavSearch({
    page,
    limit,
    search,
    filtration,
    filters,
    sortField,
    sort,
  });

  return (
    <div data-test-id="dispatches-page">
      <WithNavSearch search={navSearch}>
        <DispatchesGrid
          rows={dispatchesList.rows.map((row) => ({ ...row }))}
          totalRows={dispatchesList.total}
          currentLimit={limit}
          currentSearch={search}
          currentFilters={filters}
          currentSort={sort}
          currentSortField={sortField}
        />
      </WithNavSearch>
    </div>
  );
}
