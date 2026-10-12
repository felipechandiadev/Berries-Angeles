import { listDispatches } from '@/app/actions/dispatches';
import { WithNavSearch } from '@/app/ui/WithNavSearch';
import DispatchesGrid from './ui/DispatchesGrid';

export const dynamic = 'force-dynamic';

interface DispatchesSearchParams {
  page?: string;
  limit?: string;
}

const parseNumberParam = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
};

export default async function DispatchesPage({
  searchParams,
}: {
  searchParams?: Promise<DispatchesSearchParams>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const page = parseNumberParam(params?.page, 1);
  const limit = parseNumberParam(params?.limit, 25);

  const dispatchesList = await listDispatches({ page, limit });

  const nav = new URLSearchParams();
  nav.set('page', String(page));
  nav.set('limit', String(limit));

  return (
    <div data-test-id="dispatches-page">
      <WithNavSearch search={nav.toString()}>
        <DispatchesGrid
          rows={dispatchesList.rows.map((row) => ({ ...row }))}
          totalRows={dispatchesList.total}
        />
      </WithNavSearch>
    </div>
  );
}
