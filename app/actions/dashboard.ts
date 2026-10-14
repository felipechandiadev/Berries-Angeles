'use server';

import { getDb } from '../../data/db';

export type DashboardStats = {
  totalUsers: number;
  totalProducers: number;
  totalReceptions: number;
  totalAdvances: number;
  availablePallets: number;
  totalCustomers: number;
  totalDispatches: number;
  totalSettlements: number;
  totalTrays: number;
  activeSeasonName: string | null;
};

const EMPTY_STATS: DashboardStats = {
  totalUsers: 0,
  totalProducers: 0,
  totalReceptions: 0,
  totalAdvances: 0,
  availablePallets: 0,
  totalCustomers: 0,
  totalDispatches: 0,
  totalSettlements: 0,
  totalTrays: 0,
  activeSeasonName: null,
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
        (SELECT COUNT(*) FROM customers WHERE deletedAt IS NULL) AS totalCustomers,
        (SELECT COUNT(*) FROM transactions WHERE type = 'DISPATCH' AND deletedAt IS NULL) AS totalDispatches,
        (SELECT COUNT(*) FROM transactions WHERE type = 'SETTLEMENT' AND deletedAt IS NULL) AS totalSettlements,
        (SELECT COUNT(*) FROM trays WHERE deletedAt IS NULL) AS totalTrays,
        (SELECT name FROM seasons WHERE active = 1 AND deletedAt IS NULL LIMIT 1) AS activeSeasonName
    `);

    const row = (Array.isArray(counts) ? counts[0] : counts) as Record<string, unknown>;

    return {
      totalUsers: Number(row?.totalUsers ?? 0),
      totalProducers: Number(row?.totalProducers ?? 0),
      totalReceptions: Number(row?.totalReceptions ?? 0),
      totalAdvances: Number(row?.totalAdvances ?? 0),
      availablePallets: Number(row?.availablePallets ?? 0),
      totalCustomers: Number(row?.totalCustomers ?? 0),
      totalDispatches: Number(row?.totalDispatches ?? 0),
      totalSettlements: Number(row?.totalSettlements ?? 0),
      totalTrays: Number(row?.totalTrays ?? 0),
      activeSeasonName: row?.activeSeasonName ? String(row.activeSeasonName) : null,
    };
  } catch (error) {
    console.error('[getDashboardStats] Error:', error);
    return EMPTY_STATS;
  }
}
