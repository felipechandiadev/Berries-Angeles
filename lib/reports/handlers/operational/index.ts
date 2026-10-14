import type { ReportHandler, ReportRunResult } from '../../types';
import { REPORT_MAX_ROWS } from '../../types';
import { resolveGranularity } from '../../dates';
import {
  bucketReceptionsByDate,
  fetchReceptionRows,
  summarizeReceptions,
} from '../../query/receptionsQuery';
import {
  bucketDispatchesByDate,
  fetchDispatchRows,
  groupDispatchesByCustomer,
  summarizeDispatches,
} from '../../query/dispatchesQuery';
import {
  bucketTrayMovementsByDate,
  fetchTrayMovementRows,
  groupTrayMovementsByCounterparty,
  groupTrayMovementsByType,
  summarizeTrayMovements,
} from '../../query/traysQuery';

function nowIso() {
  return new Date().toISOString();
}

function parseBaseFilters(params: Record<string, unknown>) {
  const dateFrom = String(params.dateFrom ?? '');
  const dateTo = String(params.dateTo ?? '');
  if (!dateFrom || !dateTo) {
    throw new Error('Debes indicar dateFrom y dateTo.');
  }
  return {
    dateFrom,
    dateTo,
    seasonId: params.seasonId ? String(params.seasonId) : null,
  };
}

function truncateRows<T>(rows: T[]): { rows: T[]; truncated: boolean } {
  if (rows.length <= REPORT_MAX_ROWS) return { rows, truncated: false };
  return { rows: rows.slice(0, REPORT_MAX_ROWS), truncated: true };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

class MermaFruitBalanceHandler implements ReportHandler {
  readonly id = 'merma-fruit-balance';
  readonly title = 'Merma de fruta';
  readonly description =
    'Kg netos recibidos vs despachados en el período. La merma incluye stock no despachado, no solo pérdida física.';
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
    };
  }

  async run(ctx: { params: Record<string, unknown> }): Promise<ReportRunResult> {
    const p = this.validate(ctx.params);
    const filters = parseBaseFilters(p);
    const grain = p.granularity as 'day' | 'week' | 'month';

    const [receptionRows, dispatchRows] = await Promise.all([
      fetchReceptionRows(filters),
      fetchDispatchRows(filters),
    ]);

    const receptionSummary = summarizeReceptions(receptionRows);
    const dispatchSummary = summarizeDispatches(dispatchRows);

    const recibidosKg = receptionSummary.netWeightKg;
    const despachadosKg = dispatchSummary.fruitKg;
    const mermaKg = round2(recibidosKg - despachadosKg);
    const mermaPct =
      recibidosKg > 0 ? round2((mermaKg / recibidosKg) * 100) : null;

    const receptionBuckets = bucketReceptionsByDate(receptionRows, grain);
    const dispatchBuckets = bucketDispatchesByDate(dispatchRows, grain);

    const bucketKeys = Array.from(
      new Set([
        ...receptionBuckets.map((b) => b.x),
        ...dispatchBuckets.map((b) => b.x),
      ]),
    ).sort((a, b) => a.localeCompare(b));

    const receptionByKey = new Map(
      receptionBuckets.map((b) => [b.x, b] as const),
    );
    const dispatchByKey = new Map(dispatchBuckets.map((b) => [b.x, b] as const));

    const tableRows = bucketKeys.map((x) => {
      const r = receptionByKey.get(x);
      const d = dispatchByKey.get(x);
      const recibidos = r?.netWeightKg ?? 0;
      const despachados = d?.fruitKg ?? 0;
      const merma = round2(recibidos - despachados);
      const pct = recibidos > 0 ? round2((merma / recibidos) * 100) : null;
      return {
        periodo: x,
        recepciones: r?.count ?? 0,
        despachos: d?.count ?? 0,
        recibidosKg: recibidos,
        despachadosKg: despachados,
        mermaKg: merma,
        mermaPct: pct == null ? '—' : pct,
      };
    });

    const { rows, truncated } = truncateRows(tableRows);

    return {
      reportId: this.id,
      title: this.title,
      generatedAt: nowIso(),
      params: p,
      summary: {
        receptionCount: receptionSummary.receptionCount,
        dispatchCount: dispatchSummary.dispatchCount,
        recibidosKg,
        despachadosKg,
        mermaKg,
        mermaPct: mermaPct == null ? '—' : mermaPct,
      },
      series: [
        {
          id: 'recibidosKg',
          label: 'Kg recibidos',
          chart: 'bar',
          points: bucketKeys.map((x) => ({
            x,
            y: receptionByKey.get(x)?.netWeightKg ?? 0,
          })),
        },
        {
          id: 'despachadosKg',
          label: 'Kg despachados',
          chart: 'bar',
          points: bucketKeys.map((x) => ({
            x,
            y: dispatchByKey.get(x)?.fruitKg ?? 0,
          })),
        },
        {
          id: 'mermaKg',
          label: 'Merma kg',
          chart: 'line',
          points: bucketKeys.map((x) => {
            const recibidos = receptionByKey.get(x)?.netWeightKg ?? 0;
            const despachados = dispatchByKey.get(x)?.fruitKg ?? 0;
            return { x, y: round2(recibidos - despachados) };
          }),
        },
      ],
      columns: [
        { key: 'periodo', label: 'Período' },
        { key: 'recepciones', label: 'Recepciones', align: 'right' },
        { key: 'despachos', label: 'Despachos', align: 'right' },
        { key: 'recibidosKg', label: 'Kg recibidos', align: 'right' },
        { key: 'despachadosKg', label: 'Kg despachados', align: 'right' },
        { key: 'mermaKg', label: 'Merma kg', align: 'right' },
        { key: 'mermaPct', label: 'Merma %', align: 'right' },
      ],
      rows,
      totals: {
        recepciones: receptionSummary.receptionCount,
        despachos: dispatchSummary.dispatchCount,
        recibidosKg,
        despachadosKg,
        mermaKg,
      },
      footnotes: [
        'Merma kg = kg netos recibidos − kg netos despachados (mismo período).',
        'Incluye stock no despachado en el período; no representa solo pérdida física.',
      ],
      truncated,
    };
  }
}

class DispatchesByPeriodHandler implements ReportHandler {
  readonly id = 'dispatches-by-period';
  readonly title = 'Despachos por período';
  readonly description = 'Kg, pallets, bandejas y venta CLP de despachos en el período.';
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
    };
  }

  async run(ctx: { params: Record<string, unknown> }): Promise<ReportRunResult> {
    const p = this.validate(ctx.params);
    const filters = parseBaseFilters(p);
    const grain = p.granularity as 'day' | 'week' | 'month';
    const rows = await fetchDispatchRows(filters);
    const summary = summarizeDispatches(rows);
    const buckets = bucketDispatchesByDate(rows, grain);

    const { rows: tableRows, truncated } = truncateRows(
      rows.map((r) => ({
        id: r.id,
        fecha: r.createdAt.toISOString().slice(0, 10),
        cliente: r.customerName,
        kg: r.fruitKg,
        pallets: r.palletsCount,
        bandejas: r.traysTotal,
        venta: r.saleTotalCLP,
      })),
    );

    return {
      reportId: this.id,
      title: this.title,
      generatedAt: nowIso(),
      params: p,
      summary: {
        dispatchCount: summary.dispatchCount,
        customerCount: summary.customerCount,
        fruitKg: summary.fruitKg,
        palletsCount: summary.palletsCount,
        traysTotal: summary.traysTotal,
        saleTotalCLP: summary.saleTotalCLP,
      },
      series: [
        {
          id: 'fruitKg',
          label: 'Kg despachados',
          chart: 'line',
          points: buckets.map((b) => ({ x: b.x, y: b.fruitKg })),
        },
        {
          id: 'saleTotalCLP',
          label: 'Venta CLP',
          chart: 'bar',
          points: buckets.map((b) => ({ x: b.x, y: b.saleTotalCLP })),
        },
      ],
      columns: [
        { key: 'fecha', label: 'Fecha' },
        { key: 'cliente', label: 'Cliente' },
        { key: 'kg', label: 'Kg', align: 'right' },
        { key: 'pallets', label: 'Pallets', align: 'right' },
        { key: 'bandejas', label: 'Bandejas', align: 'right' },
        { key: 'venta', label: 'Venta CLP', align: 'right' },
      ],
      rows: tableRows,
      totals: {
        kg: summary.fruitKg,
        pallets: summary.palletsCount,
        bandejas: summary.traysTotal,
        venta: summary.saleTotalCLP,
      },
      truncated,
    };
  }
}

class DispatchesByCustomerHandler implements ReportHandler {
  readonly id = 'dispatches-by-customer';
  readonly title = 'Despachos por cliente';
  readonly description = 'Ranking de clientes por kg y venta en el período.';
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
    const rows = await fetchDispatchRows(filters);
    const summary = summarizeDispatches(rows);
    const groups = groupDispatchesByCustomer(rows, Number(p.topN) || 20);

    const { rows: tableRows, truncated } = truncateRows(
      groups.map((g) => ({
        cliente: g.customerName,
        despachos: g.count,
        kg: g.fruitKg,
        pallets: g.palletsCount,
        bandejas: g.traysTotal,
        venta: g.saleTotalCLP,
      })),
    );

    return {
      reportId: this.id,
      title: this.title,
      generatedAt: nowIso(),
      params: p,
      summary: {
        dispatchCount: summary.dispatchCount,
        customerCount: summary.customerCount,
        fruitKg: summary.fruitKg,
        saleTotalCLP: summary.saleTotalCLP,
      },
      series: [
        {
          id: 'fruitKg',
          label: 'Kg por cliente',
          chart: 'bar',
          points: groups.map((g) => ({ x: g.customerName, y: g.fruitKg })),
        },
        {
          id: 'saleTotalCLP',
          label: 'Venta CLP',
          chart: 'bar',
          points: groups.map((g) => ({ x: g.customerName, y: g.saleTotalCLP })),
        },
      ],
      columns: [
        { key: 'cliente', label: 'Cliente' },
        { key: 'despachos', label: 'Despachos', align: 'right' },
        { key: 'kg', label: 'Kg', align: 'right' },
        { key: 'pallets', label: 'Pallets', align: 'right' },
        { key: 'bandejas', label: 'Bandejas', align: 'right' },
        { key: 'venta', label: 'Venta CLP', align: 'right' },
      ],
      rows: tableRows,
      totals: {
        kg: summary.fruitKg,
        venta: summary.saleTotalCLP,
      },
      truncated,
    };
  }
}

class TrayMovementsHandler implements ReportHandler {
  readonly id = 'trays-movements';
  readonly title = 'Movimientos de bandejas';
  readonly description =
    'Entradas y salidas de bandejas en el período, por tipo y contraparte.';
  readonly wave = 'mvp' as const;

  validate(params: Record<string, unknown>) {
    const dateFrom = String(params.dateFrom ?? '');
    const dateTo = String(params.dateTo ?? '');
    if (!dateFrom || !dateTo) {
      throw new Error('Debes indicar dateFrom y dateTo.');
    }
    return {
      dateFrom,
      dateTo,
      granularity: resolveGranularity(params.granularity, dateFrom, dateTo),
      topN: Math.min(100, Math.max(1, Number(params.topN) || 20)),
    };
  }

  async run(ctx: { params: Record<string, unknown> }): Promise<ReportRunResult> {
    const p = this.validate(ctx.params);
    const grain = p.granularity as 'day' | 'week' | 'month';
    const rows = await fetchTrayMovementRows({
      dateFrom: String(p.dateFrom),
      dateTo: String(p.dateTo),
    });
    const summary = summarizeTrayMovements(rows);
    const buckets = bucketTrayMovementsByDate(rows, grain);
    const byType = groupTrayMovementsByType(rows);
    const byCounterparty = groupTrayMovementsByCounterparty(
      rows,
      Number(p.topN) || 20,
    );

    const { rows: tableRows, truncated } = truncateRows(
      rows.map((r) => ({
        id: r.id,
        fecha: r.createdAt.toISOString().slice(0, 10),
        tipo: r.typeLabel,
        direccion: r.direction === 'IN' ? 'Entrada' : 'Salida',
        cantidad: r.amount,
        bandeja: r.trayName,
        contraparte: r.counterpartyName,
      })),
    );

    return {
      reportId: this.id,
      title: this.title,
      generatedAt: nowIso(),
      params: p,
      summary: {
        movementCount: summary.movementCount,
        inCount: summary.inCount,
        outCount: summary.outCount,
        traysIn: summary.traysIn,
        traysOut: summary.traysOut,
        netTrays: summary.netTrays,
      },
      series: [
        {
          id: 'traysIn',
          label: 'Entradas',
          chart: 'bar',
          points: buckets.map((b) => ({ x: b.x, y: b.inQty })),
        },
        {
          id: 'traysOut',
          label: 'Salidas',
          chart: 'bar',
          points: buckets.map((b) => ({ x: b.x, y: b.outQty })),
        },
        {
          id: 'byType',
          label: 'Por tipo',
          chart: 'pie',
          points: byType.map((g) => ({ x: g.typeLabel, y: g.amount })),
        },
      ],
      columns: [
        { key: 'fecha', label: 'Fecha' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'direccion', label: 'Dirección' },
        { key: 'cantidad', label: 'Cantidad', align: 'right' },
        { key: 'bandeja', label: 'Bandeja' },
        { key: 'contraparte', label: 'Contraparte' },
      ],
      rows: tableRows,
      totals: {
        cantidad: summary.traysIn + summary.traysOut,
      },
      footnotes: [
        'Neto = entradas − salidas en el período (no es stock de bodega al cierre).',
        `Top contrapartes por |neto|: ${byCounterparty
          .slice(0, 5)
          .map((c) => `${c.counterpartyName} (${c.netQty})`)
          .join(', ') || '—'}`,
      ],
      truncated,
    };
  }
}

export const OPERATIONAL_REPORT_HANDLERS: ReportHandler[] = [
  new MermaFruitBalanceHandler(),
  new DispatchesByPeriodHandler(),
  new DispatchesByCustomerHandler(),
  new TrayMovementsHandler(),
];
