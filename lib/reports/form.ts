import type { ReportParamDef, ReportRegistryEntry } from './types';
import {
  dateRangeForPreset,
  type CompareWith,
  type DatePreset,
  type ReportGranularity,
} from './dates';

export type ReportFormState = {
  datePreset: DatePreset;
  dateFrom: string;
  dateTo: string;
  /** Campos dinámicos del registry (producerId, seasonId, topN, …) */
  values: Record<string, string>;
};

export function emptyReportFormState(): ReportFormState {
  const month = dateRangeForPreset('month');
  return {
    datePreset: 'month',
    dateFrom: month.dateFrom,
    dateTo: month.dateTo,
    values: {
      granularity: 'auto',
      compareWith: 'none',
      topN: '20',
    },
  };
}

/** Defaults declarados en el entry (p.ej. topN). */
export function applyEntryDefaults(
  entry: ReportRegistryEntry,
  state: ReportFormState
): ReportFormState {
  const values = { ...state.values };
  for (const param of entry.params) {
    if (param.kind === 'number' && param.default != null && !values[param.key]) {
      values[param.key] = String(param.default);
    }
    if (param.kind === 'select' && values[param.key] == null) {
      values[param.key] = '';
    }
  }
  return { ...state, values };
}

export function formStateToParams(
  entry: ReportRegistryEntry,
  state: ReportFormState
): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  for (const param of entry.params) {
    if (param.kind === 'dateRange') {
      params.dateFrom = state.dateFrom;
      params.dateTo = state.dateTo;
      continue;
    }
    if (param.kind === 'number') {
      const raw = state.values[param.key];
      const n = Number(raw);
      params[param.key] = Number.isFinite(n) ? n : (param.default ?? 0);
      continue;
    }
    if (param.kind === 'select') {
      const raw = (state.values[param.key] ?? '').trim();
      if (raw) {
        params[param.key] = raw;
      } else if (param.allowClear === false && param.options?.length) {
        params[param.key] = param.options[0].id;
      }
    }
  }

  return params;
}

export function validateFormForEntry(
  entry: ReportRegistryEntry,
  state: ReportFormState
): string | null {
  for (const param of entry.params) {
    if (param.kind === 'dateRange') {
      if (!param.required) continue;
      if (!state.dateFrom || !state.dateTo) return 'Debes indicar el rango de fechas.';
      if (state.dateFrom > state.dateTo) {
        return 'La fecha desde no puede ser mayor que hasta.';
      }
      continue;
    }
    if (!param.required) continue;
    const raw = (state.values[param.key] ?? '').trim();
    if (!raw) {
      return `Debes indicar: ${param.label}.`;
    }
    if (param.kind === 'number') {
      const n = Number(raw);
      if (!Number.isFinite(n)) return `${param.label} inválido.`;
      if (param.min != null && n < param.min) {
        return `${param.label} debe ser al menos ${param.min}.`;
      }
      if (param.max != null && n > param.max) {
        return `${param.label} no puede superar ${param.max}.`;
      }
    }
  }
  return null;
}

export function paramDefsOfKind(
  entry: ReportRegistryEntry,
  kind: ReportParamDef['kind']
): ReportParamDef[] {
  return entry.params.filter((p) => p.kind === kind);
}

export type { CompareWith, DatePreset, ReportGranularity };
