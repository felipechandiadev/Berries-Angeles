'use server';

import { getDb } from '../../data/db';

export type DashboardRecentActivity = {
  id: string;
  action: string;
  entityName: string;
  description: string;
  createdAt: string;
};

export type DashboardStats = {
  totalUsers: number;
  totalProducers: number;
  totalReceptions: number;
  totalAdvances: number;
  availablePallets: number;
  activeSeasonName: string | null;
  recentActivity: DashboardRecentActivity[];
};

const EMPTY_STATS: DashboardStats = {
  totalUsers: 0,
  totalProducers: 0,
  totalReceptions: 0,
  totalAdvances: 0,
  availablePallets: 0,
  activeSeasonName: null,
  recentActivity: [],
};

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const db = await getDb();

    const [counts] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE deletedAt IS NULL) AS totalUsers,
        (SELECT COUNT(*) FROM producers WHERE deletedAt IS NULL) AS totalProducers,
        (SELECT COUNT(*) FROM transactions WHERE type = 'RECEPTION' AND deletedAt IS NULL) AS totalReceptions,
        (SELECT COUNT(*) FROM transactions WHERE type = 'ADVANCE' AND deletedAt IS NULL) AS totalAdvances,
        (SELECT COUNT(*) FROM pallets WHERE status = 'AVAILABLE' AND deletedAt IS NULL) AS availablePallets,
        (SELECT name FROM seasons WHERE active = 1 AND deletedAt IS NULL LIMIT 1) AS activeSeasonName
    `);

    const row = (Array.isArray(counts) ? counts[0] : counts) as Record<string, unknown>;

    const recentRows = await db.query(`
      SELECT id, action, entityName, description, createdAt
      FROM audits
      ORDER BY createdAt DESC
      LIMIT 8
    `);

    const activityList = (Array.isArray(recentRows[0]) ? recentRows[0] : recentRows) as Array<{
      id: string;
      action: string;
      entityName: string;
      description: string | null;
      createdAt: Date | string;
    }>;

    return {
      totalUsers: Number(row?.totalUsers ?? 0),
      totalProducers: Number(row?.totalProducers ?? 0),
      totalReceptions: Number(row?.totalReceptions ?? 0),
      totalAdvances: Number(row?.totalAdvances ?? 0),
      availablePallets: Number(row?.availablePallets ?? 0),
      activeSeasonName: row?.activeSeasonName ? String(row.activeSeasonName) : null,
      recentActivity: activityList.map((item) => ({
        id: item.id,
        action: item.action,
        entityName: item.entityName,
        description: item.description ?? `${item.action} en ${item.entityName}`,
        createdAt:
          item.createdAt instanceof Date
            ? item.createdAt.toISOString()
            : String(item.createdAt),
      })),
    };
  } catch (error) {
    console.error('[getDashboardStats] Error:', error);
    return EMPTY_STATS;
  }
}
