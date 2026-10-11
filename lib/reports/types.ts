export type ReportChartKind = 'line' | 'area' | 'bar' | 'pie';

export type ReportSeriesPoint = {
  x: string;
  y: number;
  y2?: number;
};

export type ReportSeries = {
  id: string;
  label: string;
  chart: ReportChartKind;
  points: ReportSeriesPoint[];
};

export type ReportColumn = {
  key: string;
  label: string;
  align?: 'left' | 'right';
};

export type ReportSummaryDelta = {
  current: number;
  previous: number;
  deltaPct: number | null;
};

export type ReportRunResult = {
  reportId: string;
  title: string;
  generatedAt: string;
  params: Record<string, unknown>;
  summary: Record<string, number | string>;
  summaryDelta?: Record<string, ReportSummaryDelta>;
  series: ReportSeries[];
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  totals?: Record<string, number>;
  footnotes?: string[];
  truncated?: boolean;
};

export type ReportOption = { id: string; label: string };

/** Origen de opciones para selects del formulario de reportes. */
export type ReportOptionsSource =
  | 'producers'
  | 'varieties'
  | 'seasons'
  | 'static';

/**
 * Definición declarativa de un parámetro de reporte (única fuente de verdad para la UI).
 * El form renderiza según `kind`; no hace falta un if por cada campo nuevo.
 */
export type ReportParamDef =
  | {
      kind: 'dateRange';
      key?: 'dateRange';
      label?: string;
      required?: boolean;
    }
  | {
      kind: 'select';
      key: string;
      label: string;
      required?: boolean;
      optionsSource: ReportOptionsSource;
      /** Opciones fijas cuando optionsSource === 'static' */
      options?: ReportOption[];
      allowClear?: boolean;
      placeholder?: string;
    }
  | {
      kind: 'number';
      key: string;
      label: string;
      required?: boolean;
      default?: number;
      min?: number;
      max?: number;
    };

/** @deprecated usar ReportParamDef */
export type ReportParamKind = ReportParamDef;

export type ReportRegistryEntry = {
  id: string;
  title: string;
  description: string;
  wave: 'mvp' | 'p1';
  category: string;
  categoryLabel?: string;
  params: ReportParamDef[];
};

export type ReportHandlerContext = {
  params: Record<string, unknown>;
};

export interface ReportHandler {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly wave: 'mvp' | 'p1';
  validate(params: Record<string, unknown>): Record<string, unknown>;
  run(ctx: ReportHandlerContext): Promise<ReportRunResult>;
}

export const REPORT_MAX_ROWS = 1000;
