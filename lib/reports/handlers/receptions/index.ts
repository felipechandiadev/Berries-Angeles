import type { ReportHandler, ReportRunResult } from '../../types';
import { REPORT_MAX_ROWS } from '../../types';
import {
  buildSummaryDelta,
  compareDateRange,
  resolveGranularity,
  type CompareWith,
} from '../../dates';
import {
  bucketReceptionsByDate,
  fetchReceptionRows,
  groupByProducer,
  groupByVariety,
  summarizeReceptions,
  type ReceptionFilters,
} from '../../query/receptionsQuery';

function nowIso() {
  return new Date().toISOString();
}

function parseBaseFilters(params: Record<string, unknown>): ReceptionFilters {
  const dateFrom = String(params.dateFrom ?? '');
  const dateTo = String(params.dateTo ?? '');
  if (!dateFrom || !dateTo) {
    throw new Error('Debes indicar dateFrom y dateTo.');
  }
  return {
    dateFrom,
    dateTo,
    seasonId: params.seasonId ? String(params.seasonId) : null,
    producerId: params.producerId ? String(params.producerId) : null,
    varietyName: params.varietyName ? String(params.varietyName) : null,
    paymentStatus: params.paymentStatus ? String(params.paymentStatus) : null,
  };
}

function truncateRows<T>(rows: T[]): { rows: T[]; truncated: boolean } {
  if (rows.length <= REPORT_MAX_ROWS) return { rows, truncated: false };
  return { rows: rows.slice(0, REPORT_MAX_ROWS), truncated: true };
}

class ReceptionsByPeriodHandler implements ReportHandler {
  readonly id = 'receptions-by-period';
  readonly title = 'Resumen de recepciones';
  readonly description = 'Totales de kg, bandejas y montos en el período.';
  readonly wave = 'mvp' as const;

  validate(params: Record<string, unknown>) {
    const filters = parseBaseFilters(params);
    return {
      ...filters,
      granularity: resolveGranularity(params.granularity, filters.dateFrom, filters.dateTo),
      compareWith: (params.compareWith as CompareWith) || 'none',
    };
  }

  async run(ctx: { params: Record<string, unknown> }): Promise<ReportRunResult> {
    const p = this.validate(ctx.params);
    const filters = parseBaseFilters(p);
    const grain = p.granularity as 'day' | 'week' | 'month';
    const rows = await fetchReceptionRows(filters);
    const summary = summarizeReceptions(rows);
    const buckets = bucketReceptionsByDate(rows, grain);

    let summaryDelta: ReportRunResult['summaryDelta'];
    const cmp = compareDateRange(filters.dateFrom, filters.dateTo, p.compareWith as CompareWith);
    if (cmp) {
      const prevRows = await fetchReceptionRows({ ...filters, ...cmp });
      const prev = summarizeReceptions(prevRows);
      summaryDelta = {
        receptionCount: buildSummaryDelta(summary.receptionCount, prev.receptionCount),
        netWeightKg: buildSummaryDelta(summary.netWeightKg, prev.netWeightKg),
        totalCLP: buildSummaryDelta(summary.totalCLP, prev.totalCLP),
      };
    }

    const { rows: tableRows, truncated } = truncateRows(
      rows.map((r) => ({
        id: r.id,
        fecha: r.createdAt.toISOString().slice(0, 10),
        productor: r.producerName,
        guia: r.guideNumber,
        bandejas: r.totalTrays,
        kgNeto: r.netWeightKg,
        aPagar: r.totalCLP,
        estado: r.paymentStatus === 'PAID_ON_RECEPTION' ? 'Pagada' : 'Pendiente',
      }))
    );

    return {
      reportId: this.id,
      title: this.title,
      generatedAt: nowIso(),
      params: p,
      summary: {
        receptionCount: summary.receptionCount,
        totalTrays: summary.totalTrays,
        grossWeightKg: summary.grossWeightKg,
        netWeightKg: summary.netWeightKg,
        totalCLP: summary.totalCLP,
        paidCount: summary.paidCount,
        pendingCount: summary.pendingCount,
      },
      summaryDelta,
      series: [
        {
          id: 'netWeightKg',
          label: 'Kg neto',
          chart: 'line',
          points: buckets.map((b) => ({ x: b.x, y: b.netWeightKg })),
        },
        {
          id: 'totalCLP',
          label: 'A pagar CLP',
          chart: 'bar',
          points: buckets.map((b) => ({ x: b.x, y: b.totalCLP })),
        },
      ],
      columns: [
        { key: 'fecha', label: 'Fecha' },
        { key: 'productor', label: 'Productor' },
        { key: 'guia', label: 'Guía' },
        { key: 'bandejas', label: 'Bandejas', align: 'right' },
        { key: 'kgNeto', label: 'Kg neto', align: 'right' },
        { key: 'aPagar', label: 'A pagar', align: 'right' },
        { key: 'estado', label: 'Estado' },
      ],
      rows: tableRows,
      truncated,
    };
  }
}

class ReceptionsByProducerHandler implements ReportHandler {
  readonly id = 'receptions-by-producer';
  readonly title = 'Recepciones por productor';
  readonly description = 'Ranking de productores por kg y montos.';
  readonly wave = 'mvp' as const;

  validate(params: Record<string, unknown>) {
    const filters = parseBaseFilters(params);
    return {
      ...filters,
      topN: Math.max(1, Math.min(100, Number(params.topN) || 20)),
    };
  }

  async run(ctx: { params: Record<string, unknown> }): Promise<ReportRunResult> {
    const p = this.validate(ctx.params);
    const filters = parseBaseFilters(p);
    const topN = p.topN as number;
    const rows = await fetchReceptionRows(filters);
    const grouped = groupByProducer(rows).slice(0, topN);
    const summary = summarizeReceptions(rows);

    return {
      reportId: this.id,
      title: this.title,
      generatedAt: nowIso(),
      params: p,
      summary: {
        receptionCount: summary.receptionCount,
        producerCount: summary.producerCount,
        netWeightKg: summary.netWeightKg,
        totalCLP: summary.totalCLP,
      },
      series: [
        {
          id: 'byProducerCLP',
          label: 'A pagar por productor',
          chart: 'bar',
          points: grouped.map((g) => ({ x: g.producerName, y: g.totalCLP })),
        },
      ],
      columns: [
        { key: 'productor', label: 'Productor' },
        { key: 'recepciones', label: 'Recepciones', align: 'right' },
        { key: 'bandejas', label: 'Bandejas', align: 'right' },
        { key: 'kgNeto', label: 'Kg neto', align: 'right' },
        { key: 'aPagar', label: 'A pagar', align: 'right' },
      ],
      rows: grouped.map((g) => ({
        productor: g.producerName,
        recepciones: g.receptionCount,
        bandejas: g.totalTrays,
        kgNeto: g.netWeightKg,
        aPagar: g.totalCLP,
      })),
    };
  }
}

class ReceptionsByVarietyHandler implements ReportHandler {
  readonly id = 'receptions-by-variety';
  readonly title = 'Recepciones por variedad';
  readonly description = 'Distribución de kg y montos por variedad.';
  readonly wave = 'mvp' as const;

  validate(params: Record<string, unknown>) {
    return parseBaseFilters(params);
  }

  async run(ctx: { params: Record<string, unknown> }): Promise<ReportRunResult> {
    const filters = this.validate(ctx.params);
    const rows = await fetchReceptionRows(filters);
    let grouped = groupByVariety(rows);
    if (filters.varietyName) {
      const target = filters.varietyName.toLowerCase();
      grouped = grouped.filter((g) => g.varietyName.toLowerCase() === target);
    }
    const summary = summarizeReceptions(rows);

    return {
      reportId: this.id,
      title: this.title,
      generatedAt: nowIso(),
      params: filters,
      summary: {
        receptionCount: summary.receptionCount,
        varietyCount: grouped.length || summary.varietyCount,
        netWeightKg: summary.netWeightKg,
        totalCLP: summary.totalCLP,
      },
      series: [
        {
          id: 'byVarietyKg',
          label: 'Kg neto por variedad',
          chart: 'pie',
          points: grouped.slice(0, 12).map((g) => ({ x: g.varietyName, y: g.netWeightKg })),
        },
      ],
      columns: [
        { key: 'variedad', label: 'Variedad' },
        { key: 'recepciones', label: 'Recepciones', align: 'right' },
        { key: 'kgNeto', label: 'Kg neto', align: 'right' },
        { key: 'aPagar', label: 'A pagar', align: 'right' },
      ],
      rows: grouped.map((g) => ({
        variedad: g.varietyName,
        recepciones: g.receptionCount,
        kgNeto: g.netWeightKg,
        aPagar: g.totalCLP,
      })),
    };
  }
}

class ReceptionsPaymentStatusHandler implements ReportHandler {
  readonly id = 'receptions-payment-status';
  readonly title = 'Estado de pago';
  readonly description = 'Recepciones pagadas contra recepción vs pendientes.';
  readonly wave = 'mvp' as const;

  validate(params: Record<string, unknown>) {
    return parseBaseFilters(params);
  }

  async run(ctx: { params: Record<string, unknown> }): Promise<ReportRunResult> {
    const filters = this.validate(ctx.params);
    const rows = await fetchReceptionRows(filters);
    const summary = summarizeReceptions(rows);
    const paid = rows.filter((r) => r.paymentStatus === 'PAID_ON_RECEPTION');
    const pending = rows.filter((r) => r.paymentStatus !== 'PAID_ON_RECEPTION');

    const { rows: tableRows, truncated } = truncateRows(
      rows.map((r) => ({
        id: r.id,
        fecha: r.createdAt.toISOString().slice(0, 10),
        productor: r.producerName,
        aPagar: r.totalCLP,
        estado: r.paymentStatus === 'PAID_ON_RECEPTION' ? 'Pagada' : 'Pendiente',
      }))
    );

    return {
      reportId: this.id,
      title: this.title,
      generatedAt: nowIso(),
      params: filters,
      summary: {
        receptionCount: summary.receptionCount,
        paidCount: summary.paidCount,
        pendingCount: summary.pendingCount,
        paidPct: summary.paidPct,
        totalCLP: summary.totalCLP,
      },
      series: [
        {
          id: 'paymentMix',
          label: 'Estado de pago',
          chart: 'pie',
          points: [
            { x: 'Pagada', y: paid.length },
            { x: 'Pendiente', y: pending.length },
          ],
        },
      ],
      columns: [
        { key: 'fecha', label: 'Fecha' },
        { key: 'productor', label: 'Productor' },
        { key: 'aPagar', label: 'A pagar', align: 'right' },
        { key: 'estado', label: 'Estado' },
      ],
      rows: tableRows,
      truncated,
    };
  }
}

export const RECEPTION_REPORT_HANDLERS: ReportHandler[] = [
  new ReceptionsByPeriodHandler(),
  new ReceptionsByProducerHandler(),
  new ReceptionsByVarietyHandler(),
  new ReceptionsPaymentStatusHandler(),
];
