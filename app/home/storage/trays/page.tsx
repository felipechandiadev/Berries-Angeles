import { Suspense } from 'react';
import { TabPageLayout } from '@felipechandiadev/ui';
import ListTrays from './ui/ListTrays';
import { getTrays } from '@/app/actions/trays';
import { getTrayTransactions } from '@/app/actions/transactions';
import DotProgress from '../../../baseComponents/DotProgress/DotProgress';
import { WithNavSearch } from '@/app/ui/WithNavSearch';
import TrayMovementsDataGrid from './ui/TrayMovementsDataGrid';
import TraysTabs from './ui/TraysTabs';

export const dynamic = 'force-dynamic';

async function TraysContent({ search }: { search: string }) {
  const result = await getTrays(search ? { name: search } : undefined);
  const trays = Array.isArray(result.data) ? result.data : [];
  const plainTrays = JSON.parse(JSON.stringify(trays));
  return <ListTrays trays={plainTrays} />;
}

async function TrayMovementsContent() {
  const result = await getTrayTransactions();
  const transactions = Array.isArray(result.data) ? result.data : [];
  const plainTransactions = JSON.parse(JSON.stringify(transactions));
  return <TrayMovementsDataGrid data={plainTransactions} />;
}

export default async function Page(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const search = (typeof searchParams?.search === 'string' ? searchParams.search : '') || '';
  const tab = searchParams?.tab === 'movements' ? 'movements' : 'types';

  const buildUrl = (newTab: string) => {
    const urlParams = new URLSearchParams();
    if (search) urlParams.set('search', search);
    urlParams.set('tab', newTab);
    return `?${urlParams.toString()}`;
  };

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
          <WithNavSearch search={new URLSearchParams({ tab: 'movements', page: '1', limit: '25' }).toString()}>
            <TrayMovementsContent />
          </WithNavSearch>
        </Suspense>
      )}
    </TabPageLayout>
  );
}
