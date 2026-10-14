import type { ReportHandler, ReportRunResult } from '../../types';
import { REPORT_MAX_ROWS } from '../../types';
import { resolveGranularity } from '../../dates';
import {
  bucketAdvancesByDate,
  bucketSettlementsByDate,
  fetchAdvanceRows,
  fetchPendingPayableRows,
  fetchSettlementRows,
  groupAdvancesByProducer,
  groupPendingByProducer,
  groupSettlementsByProducer,
  summarizeAdvances,
  summarizePendingPayable,
  summarizeSettlements,
  type EconomicFilters,
} from '../../query/economicQuery';

function nowIso() {
  return new Date().toISOString();
}

function parseBaseFilters(params: Record<string, unknown>): EconomicFilters {
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
  };
}

function truncateRows<T>(rows: T[]): { rows: T[]; truncated: boolean } {
  if (rows.length <= REPORT_MAX_ROWS) return { rows, truncated: false };
  return { rows: rows.slice(0, REPORT_MAX_ROWS), truncated: true };
}

function paymentMethodLabel(method: string): string {
  switch (method) {
    case 'TRANSFER':
      return 'Transferencia';
    case 'CHECK':
      return 'Cheque';
    case 'CASH':
    default:
      return 'Efectivo';
  }
}

class PendingPayableHandler implements ReportHandler {
  readonly id = 'economic-pending-payable';
  readonly title = 'Recepciones por pagar';
  readonly description =
    'Recepciones pendientes de liquidar (no pagadas al recibir y sin liquidación asociada).';
  readonly wave = 'mvp' as const;

  validate(params: Record<string, unknown>) {
    return {
      ...parseBaseFilters(params),
      topN: Math.min(100, Math.max(1, Number(params.topN) || 20)),
    };
  }

  async run(ctx: { params: Record<string, unknown> }): Promise<ReportRunResult> {
    const p = this.validate(ctx.params);
    const filters = parseBaseFilters(p);
    const rows = await fetchPendingPayableRows(filters);
    const summary = summarizePendingPayable(rows);
    const byProducer = groupPendingByProducer(rows, Number(p.topN) || 20);

    const { rows: tableRows, truncated } = truncateRows(
      rows.map((r) => ({
        id: r.id,
        fecha: r.createdAt.toISOString().slice(0, 10),
        productor: r.producerName,
        guia: r.guideNumber,
        kgNeto: r.netWeightKg,
        aPagar: r.totalCLP,
        dias: r.ageDays,
      })),
    );

    return {
      reportId: this.id,
      title: this.title,
      generatedAt: nowIso(),
      params: p,
      summary: {
        receptionCount: summary.receptionCount,
        producerCount: summary.producerCount,
        totalCLP: summary.totalCLP,
        netWeightKg: summary.netWeightKg,
        avgAgeDays: summary.avgAgeDays,
      },
      series: [
        {
          id: 'totalCLP',
          label: 'Por pagar CLP',
          chart: 'bar',
          points: byProducer.map((g) => ({ x: g.producerName, y: g.totalCLP })),
        },
      ],
      columns: [
        { key: 'fecha', label: 'Fecha' },
        { key: 'productor', label: 'Productor' },
        { key: 'guia', label: 'Guía' },
        { key: 'kgNeto', label: 'Kg neto', align: 'right' },
        { key: 'aPagar', label: 'A pagar', align: 'right' },
        { key: 'dias', label: 'Días', align: 'right' },
      ],
      rows: tableRows,
      totals: {
        kgNeto: summary.netWeightKg,
        aPagar: summary.totalCLP,
      },
      footnotes: [
        'Solo recepciones PENDING sin vínculo RECEPTION_TO_SETTLEMENT.',
        'Excluye recepciones pagadas al recibir (PAID_ON_RECEPTION).',
      ],
      truncated,
    };
  }
}

class SettlementsHandler implements ReportHandler {
  readonly id = 'economic-settlements';
  readonly title = 'Liquidaciones';
  readonly description =
    'Liquidaciones del período: bruto de recepciones, anticipos descontados y neto pagado.';
  readonly wave = 'mvp' as const;

  validate(params: Record<string, unknown>) {
    const filters = parseBaseFilters(params);
    return {
      ...filters,
      granularity: resolveGranularity(
        params.granularity,
        filters.dateFrom,
        filters.dateTo,
      ),
      topN: Math.min(100, Math.max(1, Number(params.topN) || 20)),
    };
  }

  async run(ctx: { params: Record<string, unknown> }): Promise<ReportRunResult> {
    const p = this.validate(ctx.params);
    const filters = parseBaseFilters(p);
    const grain = p.granularity as 'day' | 'week' | 'month';
    const rows = await fetchSettlementRows(filters);
    const summary = summarizeSettlements(rows);
    const buckets = bucketSettlementsByDate(rows, grain);
    const byProducer = groupSettlementsByProducer(rows, Number(p.topN) || 20);

    const { rows: tableRows, truncated } = truncateRows(
      rows.map((r) => ({
        id: r.id,
        fecha: r.createdAt.toISOString().slice(0, 10),
        productor: r.producerName,
        estado: r.status === 'BORRADOR' ? 'Borrador' : 'Completa',
        recepciones: r.receptionCount,
        bruto: r.receptionsTotalCLP,
        anticipos: r.advancesAppliedCLP,
        neto: r.netAmountCLP,
        pago: paymentMethodLabel(r.paymentMethod),
      })),
    );

    return {
      reportId: this.id,
      title: this.title,
      generatedAt: nowIso(),
      params: p,
      summary: {
        settlementCount: summary.settlementCount,
        completaCount: summary.completaCount,
        borradorCount: summary.borradorCount,
        producerCount: summary.producerCount,
        receptionsTotalCLP: summary.receptionsTotalCLP,
        advancesAppliedCLP: summary.advancesAppliedCLP,
        netAmountCLP: summary.netAmountCLP,
      },
      series: [
        {
          id: 'netAmountCLP',
          label: 'Neto liquidado CLP',
          chart: 'bar',
          points: buckets.map((b) => ({ x: b.x, y: b.netAmountCLP })),
        },
        {
          id: 'byProducerCLP',
          label: 'Neto por productor',
          chart: 'bar',
          points: byProducer.map((g) => ({ x: g.producerName, y: g.netAmountCLP })),
        },
      ],
      columns: [
        { key: 'fecha', label: 'Fecha' },
        { key: 'productor', label: 'Productor' },
        { key: 'estado', label: 'Estado' },
        { key: 'recepciones', label: 'Recepciones', align: 'right' },
        { key: 'bruto', label: 'Bruto CLP', align: 'right' },
        { key: 'anticipos', label: 'Anticipos', align: 'right' },
        { key: 'neto', label: 'Neto CLP', align: 'right' },
        { key: 'pago', label: 'Pago' },
      ],
      rows: tableRows,
      totals: {
        bruto: summary.receptionsTotalCLP,
        anticipos: summary.advancesAppliedCLP,
        neto: summary.netAmountCLP,
      },
      truncated,
    };
  }
}

class AdvancesHandler implements ReportHandler {
  readonly id = 'economic-advances';
  readonly title = 'Anticipos';
  readonly description =
    'Anticipos otorgados en el período: monto, aplicado en liquidaciones y saldo disponible.';
  readonly wave = 'mvp' as const;

  validate(params: Record<string, unknown>) {
    const filters = parseBaseFilters(params);
    return {
      ...filters,
      granularity: resolveGranularity(
        params.granularity,
        filters.dateFrom,
        filters.dateTo,
      ),
      topN: Math.min(100, Math.max(1, Number(params.topN) || 20)),
    };
  }

  async run(ctx: { params: Record<string, unknown> }): Promise<ReportRunResult> {
    const p = this.validate(ctx.params);
    const filters = parseBaseFilters(p);
    const grain = p.granularity as 'day' | 'week' | 'month';
    const rows = await fetchAdvanceRows(filters);
    const summary = summarizeAdvances(rows);
    const buckets = bucketAdvancesByDate(rows, grain);
    const byProducer = groupAdvancesByProducer(rows, Number(p.topN) || 20);

    const { rows: tableRows, truncated } = truncateRows(
      rows.map((r) => ({
        id: r.id,
        fecha: r.createdAt.toISOString().slice(0, 10),
        productor: r.producerName,
        monto: r.amount,
        aplicado: r.appliedAmount,
        disponible: r.availableAmount,
        estado: r.status === 'APPLIED' ? 'Aplicado' : 'Activo',
        pago: paymentMethodLabel(r.paymentMethod),
      })),
    );

    return {
      reportId: this.id,
      title: this.title,
      generatedAt: nowIso(),
      params: p,
      summary: {
        advanceCount: summary.advanceCount,
        activeCount: summary.activeCount,
        appliedCount: summary.appliedCount,
        producerCount: summary.producerCount,
        amount: summary.amount,
        appliedAmount: summary.appliedAmount,
        availableAmount: summary.availableAmount,
      },
      series: [
        {
          id: 'amount',
          label: 'Anticipos CLP',
          chart: 'bar',
          points: buckets.map((b) => ({ x: b.x, y: b.amount })),
        },
        {
          id: 'statusMix',
          label: 'Estado',
          chart: 'pie',
          points: [
            { x: 'Activo', y: summary.activeCount },
            { x: 'Aplicado', y: summary.appliedCount },
          ],
        },
        {
          id: 'byProducerAmount',
          label: 'Por productor',
          chart: 'bar',
          points: byProducer.map((g) => ({ x: g.producerName, y: g.amount })),
        },
      ],
      columns: [
        { key: 'fecha', label: 'Fecha' },
        { key: 'productor', label: 'Productor' },
        { key: 'monto', label: 'Monto', align: 'right' },
        { key: 'aplicado', label: 'Aplicado', align: 'right' },
        { key: 'disponible', label: 'Disponible', align: 'right' },
        { key: 'estado', label: 'Estado' },
        { key: 'pago', label: 'Pago' },
      ],
      rows: tableRows,
      totals: {
        monto: summary.amount,
        aplicado: summary.appliedAmount,
        disponible: summary.availableAmount,
      },
      truncated,
    };
  }
}

export const ECONOMIC_REPORT_HANDLERS: ReportHandler[] = [
  new PendingPayableHandler(),
  new SettlementsHandler(),
  new AdvancesHandler(),
];
