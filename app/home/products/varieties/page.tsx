import { redirect } from 'next/navigation';

export default async function LegacyProductsVarietiesRedirect({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const q = new URLSearchParams();
  q.set('tab', 'varieties');
  if (typeof params?.search === 'string') q.set('search', params.search);
  redirect(`/home/varieties?${q.toString()}`);
}
