import { redirect } from 'next/navigation';

export default async function LegacyStoragePalletsRedirect({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (typeof value === 'string') query.set(key, value);
    else if (Array.isArray(value) && value[0]) query.set(key, value[0]);
  }
  const qs = query.toString();
  redirect(qs ? `/home/dispatch/pallets?${qs}` : '/home/dispatch/pallets');
}
