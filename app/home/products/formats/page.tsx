import { redirect } from 'next/navigation';

export default async function LegacyProductsFormatsRedirect({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const q = new URLSearchParams();
  q.set('tab', 'qualities');
  if (typeof params?.search === 'string') q.set('search', params.search);
  redirect(`/home/varieties?${q.toString()}`);
}
