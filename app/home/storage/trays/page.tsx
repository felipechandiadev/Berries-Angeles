import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { TabPageLayout } from '@felipechandiadev/ui';
import ListTrays from './ui/ListTrays';
import { getTrays } from '@/app/actions/trays';
import { getTrayMovementsGridData } from '@/app/actions/transactions';
import DotProgress from '../../../baseComponents/DotProgress/DotProgress';
import { WithNavSearch } from '@/app/ui/WithNavSearch';
import { buildGridNavSearch } from '@/lib/gridQuery';
import TrayMovementsDataGrid from './ui/TrayMovementsDataGrid';
import TraysTabs from './ui/TraysTabs';

export const dynamic = 'force-dynamic';

async function TraysContent({ search }: { search: string }) {
  const result = await getTrays(search ? { name: search } : undefined);
  const trays = Array.isArray(result.data) ? result.data : [];
  const plainTrays = JSON.parse(JSON.stringify(trays));
  return <ListTrays trays={plainTrays} />;
}

async function TrayMovementsContent({
  page,
  limit,
  search,
  filters,
  filtration,
  sortField,
  sort,
}: {
  page: number;
  limit: number;
  search: string;
  filters: string;
  filtration: boolean;
  sortField?: string;
  sort?: string;
}) {
  const result = await getTrayMovementsGridData({
    page,
    limit,
    search,
    filters,
    filtration,
    sortField,
    sort,
  });
  const plainTransactions = JSON.parse(JSON.stringify(result.data ?? []));
  return (
    <TrayMovementsDataGrid
      data={plainTransactions}
      totalRows={result.totalRecords}
      currentLimit={limit}
      currentSearch={search}
      currentFilters={filters}
      currentSort={sort}
      currentSortField={sortField}
    />
  );
}

export default async function Page(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const search = (typeof searchParams?.search === 'string' ? searchParams.search : '') || '';
  const tab = searchParams?.tab === 'movements' ? 'movements' : 'types';

  if (tab === 'movements' && (!searchParams?.page || !searchParams?.limit)) {
    const query = new URLSearchParams();
    query.set('tab', 'movements');
    if (searchParams?.sort) query.set('sort', String(searchParams.sort));
    if (searchParams?.sortField) query.set('sortField', String(searchParams.sortField));
    if (searchParams?.search) query.set('search', String(searchParams.search));
    if (searchParams?.filtration) query.set('filtration', String(searchParams.filtration));
    if (searchParams?.filters) query.set('filters', String(searchParams.filters));
    query.set('page', String(searchParams?.page || '1'));
    query.set('limit', String(searchParams?.limit || '25'));
    redirect(`/home/storage/trays?${query.toString()}`);
  }

  const page = parseInt(String(searchParams?.page || '1'), 10) || 1;
  const limit = parseInt(String(searchParams?.limit || '25'), 10) || 25;
  const filters = typeof searchParams?.filters === 'string' ? searchParams.filters : '';
  const filtration = searchParams?.filtration === 'true';
  const sortField =
    typeof searchParams?.sortField === 'string' ? searchParams.sortField : undefined;
  const sort =
    searchParams?.sort === 'asc' || searchParams?.sort === 'ASC'
      ? 'ASC'
      : searchParams?.sort === 'desc' || searchParams?.sort === 'DESC'
        ? 'DESC'
        : undefined;

  const buildUrl = (newTab: string) => {
    const urlParams = new URLSearchParams();
    if (search) urlParams.set('search', search);
    urlParams.set('tab', newTab);
    if (newTab === 'movements') {
      urlParams.set('page', String(page));
      urlParams.set('limit', String(limit));
      if (sortField) urlParams.set('sortField', sortField);
      if (sort) urlParams.set('sort', sort);
      if (filters) urlParams.set('filters', filters);
      if (filtration) urlParams.set('filtration', 'true');
    }
    return `?${urlParams.toString()}`;
  };

  const movementsNavSearch = buildGridNavSearch({
    page,
    limit,
    search,
    filtration,
    filters,
    sortField,
    sort,
    extra: { tab: 'movements' },
  });

  return (
    <TabPageLayout
      title="Bandejas"
      tabs={
        <TraysTabs
          typesHref={buildUrl('types')}
          movementsHref={buildUrl('movements')}
          activeTab={tab}
        />
      }
      compact
      data-test-id="trays-layout"
    >
      {tab === 'types' && (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-96">
              <DotProgress />
            </div>
          }
        >
          <TraysContent search={search} />
        </Suspense>
      )}

      {tab === 'movements' && (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-96">
              <DotProgress />
            </div>
          }
        >
          <WithNavSearch search={movementsNavSearch}>
            <TrayMovementsContent
              page={page}
              limit={limit}
              search={search}
              filters={filters}
              filtration={filtration}
              sortField={sortField}
              sort={sort}
            />
          </WithNavSearch>
        </Suspense>
      )}
    </TabPageLayout>
  );
}
