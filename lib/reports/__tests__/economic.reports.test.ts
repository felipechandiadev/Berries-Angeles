import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getDb, closeDb } from '@/data/db';
import { Transaction, TransactionType } from '@/data/entities/Transaction';
import { ECONOMIC_REPORT_HANDLERS } from '@/lib/reports/handlers/economic';
import { handlersToMap, runReport } from '@/lib/reports/runner';
import type { ReportRunResult } from '@/lib/reports/types';

const handlers = handlersToMap(ECONOMIC_REPORT_HANDLERS);

function assertShape(data: ReportRunResult, reportId: string) {
  expect(data.reportId).toBe(reportId);
  expect(data.title).toBeTruthy();
  expect(data.summary).toBeTypeOf('object');
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

describe('Reportes económicos', () => {
  it('economic-pending-payable — shape y totales coherentes', async () => {
    const data = await run('economic-pending-payable', wide);
    expect(data.summary).toHaveProperty('receptionCount');
    expect(data.summary).toHaveProperty('totalCLP');
    expect(Number(data.summary.receptionCount)).toBeGreaterThanOrEqual(0);
    expect(Number(data.summary.totalCLP)).toBeGreaterThanOrEqual(0);
  });

  it('economic-settlements — neto = bruto − anticipos (aprox. por fila seed)', async () => {
    const data = await run('economic-settlements', wide);
    expect(data.summary).toHaveProperty('netAmountCLP');
    expect(data.summary).toHaveProperty('receptionsTotalCLP');
    expect(data.summary).toHaveProperty('advancesAppliedCLP');
    const bruto = Number(data.summary.receptionsTotalCLP);
    const anticipos = Number(data.summary.advancesAppliedCLP);
    const neto = Number(data.summary.netAmountCLP);
    expect(neto).toBeLessThanOrEqual(bruto);
    expect(anticipos).toBeGreaterThanOrEqual(0);
  });

  it('economic-advances — disponible = monto − aplicado', async () => {
    const data = await run('economic-advances', wide);
    const amount = Number(data.summary.amount);
    const applied = Number(data.summary.appliedAmount);
    const available = Number(data.summary.availableAmount);
    expect(available).toBeCloseTo(Math.max(amount - applied, 0), 0);
    expect(
      Number(data.summary.activeCount) + Number(data.summary.appliedCount),
    ).toBe(Number(data.summary.advanceCount));
  });

  it('período vacío → ceros en los tres reportes', async () => {
    const empty = {
      dateFrom: '2099-01-01',
      dateTo: '2099-01-31',
      granularity: 'day',
    };
    for (const id of [
      'economic-pending-payable',
      'economic-settlements',
      'economic-advances',
    ] as const) {
      const data = await run(id, empty);
      const countKey =
        id === 'economic-pending-payable'
          ? 'receptionCount'
          : id === 'economic-settlements'
            ? 'settlementCount'
            : 'advanceCount';
      expect(Number(data.summary[countKey])).toBe(0);
      expect(data.rows.length).toBe(0);
    }
  });
});
