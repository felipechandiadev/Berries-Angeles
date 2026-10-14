import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getDb, closeDb } from '@/data/db';
import { Transaction, TransactionType } from '@/data/entities/Transaction';
import { OPERATIONAL_REPORT_HANDLERS } from '@/lib/reports/handlers/operational';
import { handlersToMap, runReport } from '@/lib/reports/runner';
import type { ReportRunResult } from '@/lib/reports/types';

const handlers = handlersToMap(OPERATIONAL_REPORT_HANDLERS);

function assertShape(data: ReportRunResult, reportId: string) {
  expect(data.reportId).toBe(reportId);
  expect(data.title).toBeTruthy();
  expect(Array.isArray(data.series)).toBe(true);
  expect(Array.isArray(data.columns)).toBe(true);
  expect(Array.isArray(data.rows)).toBe(true);
}

async function run(
  reportId: string,
  params: Record<string, unknown>,
): Promise<ReportRunResult> {
  const data = await runReport(handlers, reportId, params);
  assertShape(data, reportId);
  return data;
}

const wide = {
  dateFrom: '2023-01-01',
  dateTo: '2026-12-31',
  granularity: 'month' as const,
};

beforeAll(async () => {
  const db = await getDb();
  const count = await db.getRepository(Transaction).count({
    where: { type: TransactionType.RECEPTION },
  });
  if (count < 1) {
    throw new Error(
      'No hay recepciones en DB. Corré `npm run seed:full` antes de los tests.',
    );
  }
}, 60_000);

afterAll(async () => {
  await closeDb();
});

describe('Reportes operativos — despachos y bandejas', () => {
  it('dispatches-by-period', async () => {
    const data = await run('dispatches-by-period', wide);
    expect(data.summary).toHaveProperty('dispatchCount');
    expect(data.summary).toHaveProperty('fruitKg');
    expect(data.summary).toHaveProperty('saleTotalCLP');
    expect(Number(data.summary.fruitKg)).toBeGreaterThanOrEqual(0);
  });

  it('dispatches-by-customer', async () => {
    const data = await run('dispatches-by-customer', { ...wide, topN: 10 });
    expect(data.summary).toHaveProperty('customerCount');
    expect(data.columns.some((c) => c.key === 'cliente')).toBe(true);
  });

  it('trays-movements', async () => {
    const data = await run('trays-movements', wide);
    expect(data.summary).toHaveProperty('movementCount');
    expect(data.summary).toHaveProperty('traysIn');
    expect(data.summary).toHaveProperty('traysOut');
    expect(data.summary).toHaveProperty('netTrays');
    const net =
      Number(data.summary.traysIn) - Number(data.summary.traysOut);
    expect(Number(data.summary.netTrays)).toBe(net);
  });

  it('período vacío → ceros', async () => {
    const empty = {
      dateFrom: '2099-01-01',
      dateTo: '2099-01-31',
      granularity: 'day',
    };
    const d = await run('dispatches-by-period', empty);
    expect(Number(d.summary.dispatchCount)).toBe(0);
    const t = await run('trays-movements', empty);
    expect(Number(t.summary.movementCount)).toBe(0);
  });
});
