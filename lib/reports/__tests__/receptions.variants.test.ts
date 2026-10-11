import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getDb, closeDb } from '@/data/db';
import { Transaction, TransactionType } from '@/data/entities/Transaction';
import { Producer } from '@/data/entities/Producer';
import { Season } from '@/data/entities/Season';
import { Variety } from '@/data/entities/Variety';
import { RECEPTION_REPORT_HANDLERS } from '@/lib/reports/handlers/receptions';
import { handlersToMap, runReport } from '@/lib/reports/runner';
import { formStateToParams, emptyReportFormState, applyEntryDefaults } from '@/lib/reports/form';
import { RECEPTION_REPORT_REGISTRY } from '@/app/home/reports/receptions/report-registry';
import type { ReportRunResult } from '@/lib/reports/types';

const handlers = handlersToMap(RECEPTION_REPORT_HANDLERS);

type Fixture = {
  dateFrom: string;
  dateTo: string;
  seasonIds: string[];
  producerIds: string[];
  varietyIds: string[];
  varietyNames: string[];
  receptionCount: number;
};

let fixture: Fixture;

function assertReportShape(data: ReportRunResult, reportId: string) {
  expect(data.reportId).toBe(reportId);
  expect(data.title).toBeTruthy();
  expect(data.generatedAt).toBeTruthy();
  expect(data.summary).toBeTypeOf('object');
  expect(Array.isArray(data.series)).toBe(true);
  expect(Array.isArray(data.columns)).toBe(true);
  expect(Array.isArray(data.rows)).toBe(true);
  for (const series of data.series) {
    expect(series.id).toBeTruthy();
    expect(series.label).toBeTruthy();
    expect(['line', 'area', 'bar', 'pie']).toContain(series.chart);
    expect(Array.isArray(series.points)).toBe(true);
  }
}

async function run(
  reportId: string,
  params: Record<string, unknown>
): Promise<ReportRunResult> {
  const data = await runReport(handlers, reportId, params);
  assertReportShape(data, reportId);
  return data;
}

beforeAll(async () => {
  const db = await getDb();
  const receptionCount = await db.getRepository(Transaction).count({
    where: { type: TransactionType.RECEPTION },
  });
  if (receptionCount < 1) {
    throw new Error(
      'No hay recepciones en DB. Corré `npm run seed:full` antes de los tests.'
    );
  }

  const seasons = await db.getRepository(Season).find({ take: 4 });
  const producers = await db
    .getRepository(Producer)
    .createQueryBuilder('p')
    .innerJoin(Transaction, 'tx', 'tx.producerId = p.id AND tx.type = :type', {
      type: TransactionType.RECEPTION,
    })
    .select(['p.id'])
    .distinct(true)
    .take(5)
    .getMany();
  const varieties = await db.getRepository(Variety).find({ take: 4 });

  // Rango amplio que cubre el seed histórico 2023–2026
  fixture = {
    dateFrom: '2023-01-01',
    dateTo: '2026-12-31',
    seasonIds: seasons.map((s) => String(s.id)),
    producerIds: producers.map((p) => String(p.id)),
    varietyIds: varieties.map((v) => String(v.id)),
    varietyNames: varieties.map((v) => v.name),
    receptionCount,
  };
}, 60_000);

afterAll(async () => {
  await closeDb();
});

describe('Reportes recepciones — variantes y combinaciones', () => {
  describe('receptions-by-period', () => {
    const reportId = 'receptions-by-period';
    const grains = ['auto', 'day', 'week', 'month'] as const;
    const compares = ['none', 'previousPeriod', 'samePeriodLastYear'] as const;

    it.each(grains)('granularity=%s', async (granularity) => {
      const data = await run(reportId, {
        dateFrom: fixture.dateFrom,
        dateTo: fixture.dateTo,
        granularity,
        compareWith: 'none',
      });
      expect(Number(data.summary.receptionCount)).toBeGreaterThan(0);
      expect(data.series.length).toBeGreaterThanOrEqual(1);
    });

    it.each(compares)('compareWith=%s', async (compareWith) => {
      const data = await run(reportId, {
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
        granularity: 'month',
        compareWith,
      });
      expect(Number(data.summary.receptionCount)).toBeGreaterThanOrEqual(0);
      if (compareWith === 'none') {
        expect(data.summaryDelta).toBeUndefined();
      } else {
        expect(data.summaryDelta).toBeTruthy();
        expect(data.summaryDelta?.receptionCount).toBeTruthy();
      }
    });

    it('con seasonId filtra', async () => {
      if (!fixture.seasonIds[0]) return;
      const all = await run(reportId, {
        dateFrom: fixture.dateFrom,
        dateTo: fixture.dateTo,
        granularity: 'month',
        compareWith: 'none',
      });
      const filtered = await run(reportId, {
        dateFrom: fixture.dateFrom,
        dateTo: fixture.dateTo,
        seasonId: fixture.seasonIds[0],
        granularity: 'month',
        compareWith: 'none',
      });
      expect(Number(filtered.summary.receptionCount)).toBeLessThanOrEqual(
        Number(all.summary.receptionCount)
      );
    });

    it('rango sin datos → 0 recepciones sin error', async () => {
      const data = await run(reportId, {
        dateFrom: '2010-01-01',
        dateTo: '2010-01-31',
        granularity: 'day',
        compareWith: 'none',
      });
      expect(Number(data.summary.receptionCount)).toBe(0);
      expect(data.rows).toHaveLength(0);
    });
  });

  describe('receptions-by-producer', () => {
    const reportId = 'receptions-by-producer';

    it.each([5, 10, 20])('topN=%i', async (topN) => {
      const data = await run(reportId, {
        dateFrom: fixture.dateFrom,
        dateTo: fixture.dateTo,
        topN,
      });
      expect(data.rows.length).toBeLessThanOrEqual(topN);
      expect(Number(data.summary.receptionCount)).toBeGreaterThan(0);
      expect(data.series[0]?.chart).toBe('bar');
    });

    it('filtro producerId', async () => {
      if (!fixture.producerIds[0]) return;
      const data = await run(reportId, {
        dateFrom: fixture.dateFrom,
        dateTo: fixture.dateTo,
        producerId: fixture.producerIds[0],
        topN: 20,
      });
      expect(data.rows.length).toBeLessThanOrEqual(1);
      expect(Number(data.summary.receptionCount)).toBeGreaterThan(0);
    });

    it('producerId + seasonId', async () => {
      if (!fixture.producerIds[0] || !fixture.seasonIds[0]) return;
      const data = await run(reportId, {
        dateFrom: fixture.dateFrom,
        dateTo: fixture.dateTo,
        producerId: fixture.producerIds[0],
        seasonId: fixture.seasonIds[0],
        topN: 10,
      });
      expect(Number(data.summary.receptionCount)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('receptions-by-variety', () => {
    const reportId = 'receptions-by-variety';

    it('sin filtro de variedad', async () => {
      const data = await run(reportId, {
        dateFrom: fixture.dateFrom,
        dateTo: fixture.dateTo,
      });
      expect(Number(data.summary.receptionCount)).toBeGreaterThan(0);
      expect(data.series[0]?.chart).toBe('pie');
      expect(data.rows.length).toBeGreaterThan(0);
    });

    it.each([0, 1])('varietyName index %i', async (idx) => {
      const name = fixture.varietyNames[idx];
      if (!name) return;
      const data = await run(reportId, {
        dateFrom: fixture.dateFrom,
        dateTo: fixture.dateTo,
        varietyName: name,
      });
      // Puede ser 0 si esa variedad no aparece en packs del seed
      expect(Number(data.summary.receptionCount)).toBeGreaterThanOrEqual(0);
      if (data.rows.length) {
        expect(
          data.rows.every((r) => String(r.variedad).toLowerCase() === name.toLowerCase())
        ).toBe(true);
      }
    });

    it('varietyName + seasonId', async () => {
      if (!fixture.varietyNames[0] || !fixture.seasonIds[0]) return;
      const data = await run(reportId, {
        dateFrom: fixture.dateFrom,
        dateTo: fixture.dateTo,
        varietyName: fixture.varietyNames[0],
        seasonId: fixture.seasonIds[0],
      });
      expect(data.reportId).toBe(reportId);
    });
  });

  describe('receptions-payment-status', () => {
    const reportId = 'receptions-payment-status';

    it('sin filtro de pago', async () => {
      const data = await run(reportId, {
        dateFrom: fixture.dateFrom,
        dateTo: fixture.dateTo,
      });
      const paid = Number(data.summary.paidCount);
      const pending = Number(data.summary.pendingCount);
      expect(paid + pending).toBe(Number(data.summary.receptionCount));
      expect(data.series[0]?.chart).toBe('pie');
    });

    it.each(['PENDING', 'PAID_ON_RECEPTION'] as const)(
      'paymentStatus=%s',
      async (paymentStatus) => {
        const data = await run(reportId, {
          dateFrom: fixture.dateFrom,
          dateTo: fixture.dateTo,
          paymentStatus,
        });
        expect(Number(data.summary.receptionCount)).toBeGreaterThan(0);
        if (paymentStatus === 'PENDING') {
          expect(Number(data.summary.pendingCount)).toBe(
            Number(data.summary.receptionCount)
          );
          expect(Number(data.summary.paidCount)).toBe(0);
        } else {
          expect(Number(data.summary.paidCount)).toBe(
            Number(data.summary.receptionCount)
          );
          expect(Number(data.summary.pendingCount)).toBe(0);
        }
      }
    );

    it('paymentStatus + seasonId', async () => {
      if (!fixture.seasonIds[0]) return;
      const data = await run(reportId, {
        dateFrom: fixture.dateFrom,
        dateTo: fixture.dateTo,
        paymentStatus: 'PENDING',
        seasonId: fixture.seasonIds[0],
      });
      expect(Number(data.summary.paidCount)).toBe(0);
    });
  });

  describe('registry ↔ formStateToParams', () => {
    it('cada entry del registry genera params válidos y corre', async () => {
      for (const entry of RECEPTION_REPORT_REGISTRY) {
        const form = applyEntryDefaults(entry, emptyReportFormState());
        form.dateFrom = fixture.dateFrom;
        form.dateTo = fixture.dateTo;
        form.datePreset = 'custom';
        const params = formStateToParams(entry, form);
        expect(params.dateFrom).toBe(fixture.dateFrom);
        expect(params.dateTo).toBe(fixture.dateTo);
        const data = await run(entry.id, params);
        expect(data.reportId).toBe(entry.id);
      }
    });
  });

  describe('pool / concurrencia', () => {
    it('10 reportes en paralelo no fallan por conexiones', async () => {
      const jobs = Array.from({ length: 10 }, (_, i) => {
        const reportId =
          RECEPTION_REPORT_REGISTRY[i % RECEPTION_REPORT_REGISTRY.length].id;
        return run(reportId, {
          dateFrom: '2025-01-01',
          dateTo: '2025-12-31',
          granularity: 'month',
          compareWith: 'none',
          topN: 10,
        });
      });
      const results = await Promise.all(jobs);
      expect(results).toHaveLength(10);
      results.forEach((r) => expect(r.summary).toBeTruthy());

      const db1 = await getDb();
      const db2 = await getDb();
      expect(db1).toBe(db2);
    });
  });
});
