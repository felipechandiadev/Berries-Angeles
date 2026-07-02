import { getServerSession } from 'next-auth';
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
    <div className="space-y-6 pb-8" data-test-id="home-dashboard">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" data-test-id="home-title">
          Dashboard
        </h1>
      </div>

      <DashboardStats stats={stats} userName={userName} />
    </div>
  );
}
