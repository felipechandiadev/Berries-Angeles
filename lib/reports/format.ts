export function formatReportMoney(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function formatReportKg(value: number): string {
  return `${new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)} kg`;
}

export function formatReportCount(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function formatReportPercent(value: number): string {
  return `${new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 1,
  }).format(Number(value) || 0)}%`;
}

export function formatReportSummaryLabel(key: string): string {
  const map: Record<string, string> = {
    receptionCount: 'Recepciones',
    totalTrays: 'Bandejas',
    grossWeightKg: 'Kg bruto',
    netWeightKg: 'Kg neto',
    totalCLP: 'A pagar (CLP)',
    payableCLP: 'CLP packs',
    payableUSD: 'USD packs',
    paidCount: 'Pagadas',
    pendingCount: 'Pendientes',
    producerCount: 'Productores',
    varietyCount: 'Variedades',
    avgNetWeightKg: 'Kg neto promedio',
    paidPct: '% pagadas',
    avgAgeDays: 'Días promedio',
    settlementCount: 'Liquidaciones',
    completaCount: 'Completas',
    borradorCount: 'Borradores',
    receptionsTotalCLP: 'Bruto recepciones',
    advancesAppliedCLP: 'Anticipos aplicados',
    netAmountCLP: 'Neto liquidado',
    advanceCount: 'Anticipos',
    activeCount: 'Activos',
    appliedCount: 'Aplicados',
    amount: 'Monto anticipos',
    appliedAmount: 'Aplicado',
    availableAmount: 'Disponible',
    dispatchCount: 'Despachos',
    customerCount: 'Clientes',
    fruitKg: 'Kg fruta',
    palletsCount: 'Pallets',
    traysTotal: 'Bandejas',
    saleTotalCLP: 'Venta CLP',
    recibidosKg: 'Kg recibidos',
    despachadosKg: 'Kg despachados',
    mermaKg: 'Merma kg',
    mermaPct: 'Merma %',
    movementCount: 'Movimientos',
    inCount: 'Entradas',
    outCount: 'Salidas',
    traysIn: 'Bandejas entrada',
    traysOut: 'Bandejas salida',
    netTrays: 'Neto bandejas',
  };
  return map[key] ?? key;
}

export function formatReportSummaryValue(key: string, value: number | string): string {
  if (typeof value === 'string') return value;
  if (/pct|percent/i.test(key)) return formatReportPercent(value);
  if (/kg|weight/i.test(key)) return formatReportKg(value);
  if (/clp|usd|pay|amount|venta|bruto|neto|aplicado|disponible|monto/i.test(key)) {
    return formatReportMoney(value);
  }
  return formatReportCount(value);
}

export function formatReportParamLabel(key: string): string {
  const map: Record<string, string> = {
    dateFrom: 'Desde',
    dateTo: 'Hasta',
    producerId: 'Productor',
    varietyId: 'Variedad',
    seasonId: 'Temporada',
    paymentStatus: 'Estado pago',
    granularity: 'Granularidad',
    compareWith: 'Comparar',
    topN: 'Top N',
  };
  return map[key] ?? key;
}

export function formatReportParamValue(key: string, value: unknown): string {
  if (value == null || value === '') return '—';
  if (key === 'paymentStatus') {
    return value === 'PAID_ON_RECEPTION' ? 'Pagada' : 'Pendiente';
  }
  if (key === 'compareWith') {
    if (value === 'previousPeriod') return 'Período anterior';
    if (value === 'samePeriodLastYear') return 'Mismo lapso año pasado';
    return 'Sin comparación';
  }
  return String(value);
}

export function formatReportCell(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? formatReportCount(value)
      : new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(value);
  }
  return String(value);
}

export function formatReportAxisLabel(x: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(x)) {
    const [y, m, d] = x.split('-');
    return `${d}/${m}`;
  }
  return x;
}

/** Detecta series monetarias (CLP) por id o label. */
export function isReportMoneySeries(seriesId: string, seriesLabel?: string): boolean {
  const haystack = `${seriesId} ${seriesLabel ?? ''}`;
  return /clp|payable|a pagar|pay|monto|\$/i.test(haystack);
}

/** Formatea el valor de una serie de gráfico (dinero / kg / conteo). */
export function formatReportSeriesValue(
  seriesId: string,
  value: number,
  seriesLabel?: string
): string {
  if (isReportMoneySeries(seriesId, seriesLabel)) return formatReportMoney(value);
  if (/kg|weight/i.test(`${seriesId} ${seriesLabel ?? ''}`)) return formatReportKg(value);
  return formatReportCount(value);
}
