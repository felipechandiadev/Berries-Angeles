import { Suspense } from 'react';
import { BasicPageLayout } from '@felipechandiadev/ui';
import UserList from './ui/userList';
import { getUsers } from '../../actions/users';
import DotProgress from '@/app/baseComponents/DotProgress/DotProgress';

export const dynamic = 'force-dynamic';

async function UsersContent({ search }: { search: string }) {
  const users = await getUsers(search);
  return <UserList users={users} />;
}

export default async function Page(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const search = (typeof searchParams?.search === 'string' ? searchParams.search : '') || '';

  return (
    <BasicPageLayout title="Usuarios" data-test-id="users-page">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-96">
            <DotProgress />
          </div>
        }
      >
        <UsersContent search={search} />
      </Suspense>
    </BasicPageLayout>
  );
}
