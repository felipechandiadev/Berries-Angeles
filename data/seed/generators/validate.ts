import type mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';

export type SeedValidationReport = {
  ok: boolean;
  receptionCount: number;
  paidCount: number;
  pendingCount: number;
  advanceCount: number;
  settledReceptionRelations: number;
  settledAdvanceRelations: number;
  palletCount: number;
  trayMoveCount: number;
  bySeason: Record<string, number>;
  errors: string[];
};

export async function validateFullSeed(
  connection: mysql.Connection
): Promise<SeedValidationReport> {
  const errors: string[] = [];

  const [receptionRows] = await connection.execute<
    (RowDataPacket & { total: number })[]
  >("SELECT COUNT(*) AS total FROM transactions WHERE type = 'RECEPTION' AND deletedAt IS NULL");
  const receptionCount = Number(receptionRows[0]?.total ?? 0);

  const [paidRows] = await connection.execute<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total FROM transactions
     WHERE type = 'RECEPTION' AND deletedAt IS NULL
       AND JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.paymentStatus')) = 'PAID_ON_RECEPTION'`
  );
  const paidCount = Number(paidRows[0]?.total ?? 0);
  const pendingCount = receptionCount - paidCount;

  const [advanceRows] = await connection.execute<(RowDataPacket & { total: number })[]>(
    "SELECT COUNT(*) AS total FROM transactions WHERE type = 'ADVANCE' AND deletedAt IS NULL"
  );
  const advanceCount = Number(advanceRows[0]?.total ?? 0);

  const [relRec] = await connection.execute<(RowDataPacket & { total: number })[]>(
    "SELECT COUNT(*) AS total FROM transaction_relations WHERE relationType = 'RECEPTION_TO_SETTLEMENT'"
  );
  const settledReceptionRelations = Number(relRec[0]?.total ?? 0);

  const [relAdv] = await connection.execute<(RowDataPacket & { total: number })[]>(
    "SELECT COUNT(*) AS total FROM transaction_relations WHERE relationType = 'ADVANCE_TO_SETTLEMENT'"
  );
  const settledAdvanceRelations = Number(relAdv[0]?.total ?? 0);

  const [palletRows] = await connection.execute<(RowDataPacket & { total: number })[]>(
    'SELECT COUNT(*) AS total FROM pallets WHERE deletedAt IS NULL'
  );
  const palletCount = Number(palletRows[0]?.total ?? 0);

  const [trayMoveRows] = await connection.execute<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total FROM transactions
     WHERE type IN (
       'TRAY_IN_FROM_PRODUCER','TRAY_OUT_TO_PRODUCER',
       'TRAY_OUT_TO_CLIENT','TRAY_IN_FROM_CLIENT',
       'PALLET_TRAY_ASSIGNMENT','PALLET_TRAY_RELEASE'
     ) AND deletedAt IS NULL`
  );
  const trayMoveCount = Number(trayMoveRows[0]?.total ?? 0);

  const [seasonCounts] = await connection.execute<
    (RowDataPacket & { seasonId: string; total: number })[]
  >(
    `SELECT seasonId, COUNT(*) AS total FROM transactions
     WHERE type = 'RECEPTION' AND deletedAt IS NULL
     GROUP BY seasonId`
  );
  const bySeason: Record<string, number> = {};
  seasonCounts.forEach((row) => {
    bySeason[String(row.seasonId)] = Number(row.total);
  });

  if (receptionCount < 500) {
    errors.push(`Expected >= 500 receptions, got ${receptionCount}`);
  }
  if (paidCount < 100) {
    errors.push(`Expected many PAID_ON_RECEPTION, got ${paidCount}`);
  }
  if (advanceCount < 30) {
    errors.push(`Expected >= 30 advances, got ${advanceCount}`);
  }
  if (settledReceptionRelations < 10) {
    errors.push(`Expected settlement relations on receptions, got ${settledReceptionRelations}`);
  }
  if (palletCount !== 0) {
    errors.push(`Expected 0 pallets, got ${palletCount}`);
  }

  // Spot-check: pack totals vs metadata for a sample
  const [sample] = await connection.execute<(RowDataPacket & { id: string; metadata: string })[]>(
    `SELECT id, metadata FROM transactions WHERE type = 'RECEPTION' ORDER BY id DESC LIMIT 5`
  );
  for (const row of sample) {
    let meta: any;
    try {
      meta = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
    } catch {
      errors.push(`Reception ${row.id}: invalid metadata JSON`);
      continue;
    }
    if (!meta?.paymentStatus) {
      errors.push(`Reception ${row.id}: missing paymentStatus`);
    }
    const packs = Array.isArray(meta?.packs) ? meta.packs : [];
    const sum = packs.reduce((s: number, p: any) => s + Number(p.totalToPay || 0), 0);
    const total = Number(meta?.totals?.totalCLPToPay ?? meta?.totalCLPToPay ?? 0);
    if (Math.abs(sum - total) > 1) {
      errors.push(`Reception ${row.id}: pack sum ${sum} != total ${total}`);
    }
  }

  return {
    ok: errors.length === 0,
    receptionCount,
    paidCount,
    pendingCount,
    advanceCount,
    settledReceptionRelations,
    settledAdvanceRelations,
    palletCount,
    trayMoveCount,
    bySeason,
    errors,
  };
}
