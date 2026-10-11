import { getServerSession } from 'next-auth';
import { BasicPageLayout } from '@felipechandiadev/ui';
import { authOptions } from '../api/auth/authOptions';
import { getDashboardStats } from '../actions/dashboard';
import DashboardStats from './ui/DashboardStats';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [session, stats] = await Promise.all([
    getServerSession(authOptions),
    getDashboardStats(),
  ]);

  const userName = session?.user?.name ?? undefined;

  return (
    <BasicPageLayout title="Dashboard" className="pb-8" data-test-id="home-dashboard">
      <DashboardStats stats={stats} userName={userName} />
    </BasicPageLayout>
  );
}
