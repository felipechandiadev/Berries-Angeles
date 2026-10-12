import { TabPageLayout } from '@felipechandiadev/ui';
import {
  listPendingReceptions,
  listPendingAdvances,
  listSettlements,
  getSettlementForWizard,
} from '@/app/actions/settlements';
import { getProducersSimpleListWithLabel } from '@/app/actions/producers';
import { WithNavSearch } from '@/app/ui/WithNavSearch';
import { buildGridNavSearch } from '@/lib/gridQuery';
import NewSettlementContent from './ui/NewSettlementContent';
import SettlementsGrid from './ui/SettlementsGrid';
import SettlementsTabs from './ui/SettlementsTabs';

export const dynamic = 'force-dynamic';

interface SettlementsSearchParams {
  producerId?: string;
  page?: string;
  limit?: string;
  tab?: string;
  seasonId?: string;
  search?: string;
  settlementId?: string;
  filtration?: string;
  filters?: string;
  sort?: string;
  sortField?: string;
}

const parseNumberParam = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.floor(parsed));
};

export default async function SettlementsPage({
  searchParams,
}: {
  searchParams?: Promise<SettlementsSearchParams>;
}) {
  const params = searchParams ? await searchParams : undefined;

  const seasonId = params?.seasonId?.trim() ? params.seasonId.trim() : undefined;
  const search = params?.search?.trim() ? params.search.trim() : undefined;
  const page = parseNumberParam(params?.page, 1);
  const limit = parseNumberParam(params?.limit, 25);
  const filters = params?.filters?.trim() ? params.filters.trim() : undefined;
  const filtration = params?.filtration === 'true';
  const sortField = params?.sortField?.trim() ? params.sortField.trim() : undefined;
  const sort =
    params?.sort === 'asc' || params?.sort === 'ASC'
      ? 'ASC'
      : params?.sort === 'desc' || params?.sort === 'DESC'
        ? 'DESC'
        : undefined;
  const tab = params?.tab === 'new' ? 'new' : 'list';
  const settlementIdParam = params?.settlementId?.trim() || undefined;

  const wizardLoad =
    tab === 'new' && settlementIdParam
      ? await getSettlementForWizard(settlementIdParam)
      : null;

  const editingSettlement = wizardLoad?.success === true ? wizardLoad.data : null;
  const wizardError =
    tab === 'new' && settlementIdParam && wizardLoad && !wizardLoad.success
      ? wizardLoad.error
      : null;

  const producerId =
    editingSettlement?.producerId ||
    (params?.producerId?.trim() ? params.producerId.trim() : undefined);

  const buildUrl = (newTab: string) => {
    const urlParams = new URLSearchParams();
    if (producerId) urlParams.set('producerId', producerId);
    if (newTab === 'list' && seasonId) urlParams.set('seasonId', seasonId);
    if (newTab === 'list' && search) urlParams.set('search', search);
    if (newTab === 'list' && page > 1) urlParams.set('page', page.toString());
    if (newTab === 'list' && limit !== 25) urlParams.set('limit', limit.toString());
    if (newTab === 'list' && filters) urlParams.set('filters', filters);
    if (newTab === 'list' && filtration) urlParams.set('filtration', 'true');
    if (newTab === 'list' && sortField) urlParams.set('sortField', sortField);
    if (newTab === 'list' && sort) urlParams.set('sort', sort);
    if (newTab === 'new' && settlementIdParam) urlParams.set('settlementId', settlementIdParam);
    urlParams.set('tab', newTab);
    return `?${urlParams.toString()}`;
  };

  const producerOptions = await getProducersSimpleListWithLabel();

  const settlementsList =
    tab === 'list'
      ? await listSettlements({
          producerId: params?.producerId?.trim() || undefined,
          seasonId,
          search,
          page,
          limit,
          filters,
          filtration,
          sortField,
          sort,
        })
      : null;

  const pendingPage = editingSettlement ? 1 : page;
  const pendingLimit = editingSettlement ? 100 : limit;

  const [pendingReceptions, pendingAdvances] =
    tab === 'new' && !wizardError
      ? await Promise.all([
          listPendingReceptions({
            producerId,
            page: pendingPage,
            limit: pendingLimit,
            editingSettlementId: editingSettlement?.settlementId,
          }),
          listPendingAdvances({
            producerId,
            page: pendingPage,
            limit: pendingLimit,
            editingSettlementId: editingSettlement?.settlementId,
          }),
        ])
      : [null, null];

  return (
    <TabPageLayout
      title="Liquidaciones"
      tabs={
        <SettlementsTabs
          listHref={buildUrl('list')}
          newHref={buildUrl('new')}
          activeTab={tab}
        />
      }
      compact
      data-test-id="settlements-layout"
    >
      {tab === 'list' && settlementsList && (
        <WithNavSearch
          search={buildGridNavSearch({
            page,
            limit,
            search,
            filtration,
            filters,
            sortField,
            sort,
            extra: {
              tab: 'list',
              ...(params?.producerId?.trim() ? { producerId: params.producerId.trim() } : {}),
              ...(seasonId ? { seasonId } : {}),
            },
          })}
        >
          <SettlementsGrid
            rows={settlementsList.rows.map((row) => ({ ...row }))}
            totalRows={settlementsList.total}
            currentLimit={limit}
            currentSearch={search}
            currentFilters={filters}
            currentSort={sort}
            currentSortField={sortField}
          />
        </WithNavSearch>
      )}

      {tab === 'new' && wizardError && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-secondary">
          <p>{wizardError}</p>
          <a href={buildUrl('list')} className="mt-3 inline-block text-sm text-primary underline">
            Volver a liquidaciones
          </a>
        </div>
      )}

      {tab === 'new' && !wizardError && pendingReceptions && pendingAdvances && (
        <NewSettlementContent
          producerOptions={producerOptions}
          selectedProducerId={producerId}
          receptions={pendingReceptions}
          advances={pendingAdvances}
          editingSettlement={editingSettlement}
        />
      )}
    </TabPageLayout>
  );
}
