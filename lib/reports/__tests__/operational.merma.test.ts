import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getDb, closeDb } from '@/data/db';
import { Transaction, TransactionType } from '@/data/entities/Transaction';
import { OPERATIONAL_REPORT_HANDLERS } from '@/lib/reports/handlers/operational';
import { handlersToMap, runReport } from '@/lib/reports/runner';
import type { ReportRunResult } from '@/lib/reports/types';

const handlers = handlersToMap(OPERATIONAL_REPORT_HANDLERS);
const reportId = 'merma-fruit-balance';

function assertReportShape(data: ReportRunResult) {
  expect(data.reportId).toBe(reportId);
  expect(data.title).toBeTruthy();
  expect(data.generatedAt).toBeTruthy();
  expect(data.summary).toBeTypeOf('object');
  expect(Array.isArray(data.series)).toBe(true);
  expect(Array.isArray(data.columns)).toBe(true);
  expect(Array.isArray(data.rows)).toBe(true);
  expect(data.summary).toHaveProperty('recibidosKg');
  expect(data.summary).toHaveProperty('despachadosKg');
  expect(data.summary).toHaveProperty('mermaKg');
  expect(data.summary).toHaveProperty('mermaPct');
  expect(data.summary).toHaveProperty('receptionCount');
  expect(data.summary).toHaveProperty('dispatchCount');
}

async function run(params: Record<string, unknown>): Promise<ReportRunResult> {
  const data = await runReport(handlers, reportId, params);
  assertReportShape(data);
  return data;
}

beforeAll(async () => {
  const db = await getDb();
  const receptionCount = await db.getRepository(Transaction).count({
    where: { type: TransactionType.RECEPTION },
  });
  if (receptionCount < 1) {
    throw new Error(
      'No hay recepciones en DB. Corré `npm run seed:full` antes de los tests.',
    );
  }
}, 60_000);

afterAll(async () => {
  await closeDb();
});

describe('Reporte operativo — merma-fruit-balance', () => {
  it('calcula merma = recibidos − despachados en rango amplio', async () => {
    const data = await run({
      dateFrom: '2023-01-01',
      dateTo: '2026-12-31',
      granularity: 'month',
    });

    const recibidos = Number(data.summary.recibidosKg);
    const despachados = Number(data.summary.despachadosKg);
    const merma = Number(data.summary.mermaKg);

    expect(recibidos).toBeGreaterThanOrEqual(0);
    expect(despachados).toBeGreaterThanOrEqual(0);
    expect(merma).toBeCloseTo(recibidos - despachados, 1);

    if (recibidos > 0) {
      expect(Number(data.summary.mermaPct)).toBeCloseTo(
        (merma / recibidos) * 100,
        1,
      );
    } else {
      expect(data.summary.mermaPct).toBe('—');
    }

    expect(data.series.length).toBeGreaterThanOrEqual(3);
    expect(data.columns.some((c) => c.key === 'mermaKg')).toBe(true);
  });

  it('período vacío → ceros', async () => {
    const data = await run({
      dateFrom: '2099-01-01',
      dateTo: '2099-01-31',
      granularity: 'day',
    });

    expect(Number(data.summary.receptionCount)).toBe(0);
    expect(Number(data.summary.dispatchCount)).toBe(0);
    expect(Number(data.summary.recibidosKg)).toBe(0);
    expect(Number(data.summary.despachadosKg)).toBe(0);
    expect(Number(data.summary.mermaKg)).toBe(0);
    expect(data.summary.mermaPct).toBe('—');
    expect(data.rows.length).toBe(0);
  });

  it.each(['auto', 'day', 'week', 'month'] as const)(
    'granularity=%s',
    async (granularity) => {
      const data = await run({
        dateFrom: '2023-01-01',
        dateTo: '2026-12-31',
        granularity,
      });
      expect(data.reportId).toBe(reportId);
      expect(Array.isArray(data.footnotes)).toBe(true);
    },
  );
});
