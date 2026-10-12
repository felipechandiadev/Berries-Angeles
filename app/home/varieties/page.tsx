import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { TabPageLayout } from '@felipechandiadev/ui';
import DotProgress from '@/app/baseComponents/DotProgress/DotProgress';
import { getVarieties } from '@/app/actions/varieties';
import { getFormats } from '@/app/actions/formats';
import ListVarieties from './ui/ListVarieties';
import ListQualities from './ui/qualities/ListFormats';
import VarietiesTabs from './ui/VarietiesTabs';

export const dynamic = 'force-dynamic';

async function VarietiesContent({ search }: { search: string }) {
  const result = await getVarieties(search ? { name: search } : undefined);
  const varieties = Array.isArray(result.data) ? result.data : [];
  return <ListVarieties varieties={JSON.parse(JSON.stringify(varieties))} />;
}

async function QualitiesContent({ search }: { search: string }) {
  const result = await getFormats(search ? { name: search } : undefined);
  const formats = Array.isArray(result.data) ? result.data : [];
  return <ListQualities formats={JSON.parse(JSON.stringify(formats))} />;
}

export default async function VarietiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; search?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const tabParam = params?.tab;
  const tab = tabParam === 'qualities' ? 'qualities' : 'varieties';
  const search = typeof params?.search === 'string' ? params.search : '';

  if (!tabParam) {
    const q = new URLSearchParams();
    q.set('tab', 'varieties');
    if (search) q.set('search', search);
    redirect(`/home/varieties?${q.toString()}`);
  }

  const buildUrl = (nextTab: 'varieties' | 'qualities') => {
    const q = new URLSearchParams();
    q.set('tab', nextTab);
    if (search) q.set('search', search);
    return `/home/varieties?${q.toString()}`;
  };

  return (
    <TabPageLayout
      title=""
      tabs={
        <div className="flex w-full justify-end">
          <VarietiesTabs
            varietiesHref={buildUrl('varieties')}
            qualitiesHref={buildUrl('qualities')}
            activeTab={tab}
          />
        </div>
      }
      compact
      data-test-id="varieties-layout"
    >
      {tab === 'varieties' && (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-96">
              <DotProgress />
            </div>
          }
        >
          <VarietiesContent search={search} />
        </Suspense>
      )}
      {tab === 'qualities' && (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-96">
              <DotProgress />
            </div>
          }
        >
          <QualitiesContent search={search} />
        </Suspense>
      )}
    </TabPageLayout>
  );
}
