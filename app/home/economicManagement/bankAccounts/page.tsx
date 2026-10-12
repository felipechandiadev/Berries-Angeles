import ListBankAccounts from './ui/ListBankAccounts';
import { getAdminBankAccounts } from '../../../actions/adminBankAccounts';
import { getAppConfigSettings } from '@/app/actions/appConfigSettings';
import { Suspense } from 'react';
import DotProgress from '../../../baseComponents/DotProgress/DotProgress';

export const dynamic = 'force-dynamic';

async function BankAccountsContent({ search }: { search: string }) {
  const [result, configResult] = await Promise.all([
    getAdminBankAccounts(search ? { search } : undefined),
    getAppConfigSettings(),
  ]);
  const bankAccounts = Array.isArray(result.data) ? result.data : [];
  const plainBankAccounts = JSON.parse(JSON.stringify(bankAccounts));
  const requireBankAccountsInPayments =
    configResult.data?.requireBankAccountsInPayments !== false;

  return (
    <ListBankAccounts
      bankAccounts={plainBankAccounts}
      requireBankAccountsInPayments={requireBankAccountsInPayments}
    />
  );
}

export default async function Page(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const search = (typeof searchParams?.search === 'string' ? searchParams.search : '') || '';

  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <DotProgress />
        </div>
      }
    >
      <BankAccountsContent search={search} />
    </Suspense>
  );
}
