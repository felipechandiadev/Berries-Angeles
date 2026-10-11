'use client';

import Select from '@/app/baseComponents/Select/Select';
import type { ReportFormState } from '@/lib/reports/form';
import type {
  ReportOption,
  ReportOptionsSource,
  ReportParamDef,
  ReportRegistryEntry,
} from '@/lib/reports/types';
import {
  DATE_PRESET_OPTIONS,
  dateRangeForPreset,
  type DatePreset,
} from '@/lib/reports/dates';

type Props = {
  entry: ReportRegistryEntry;
  state: ReportFormState;
  onChange: (next: ReportFormState) => void;
  producers: ReportOption[];
  varieties: ReportOption[];
  seasons: ReportOption[];
};

const fieldClass =
  'w-full rounded-md border border-border px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary';

function resolveOptions(
  param: Extract<ReportParamDef, { kind: 'select' }>,
  sources: Record<Exclude<ReportOptionsSource, 'static'>, ReportOption[]>
): ReportOption[] {
  if (param.optionsSource === 'static') return param.options ?? [];
  return sources[param.optionsSource] ?? [];
}

export default function ReportParamsForm({
  entry,
  state,
  onChange,
  producers,
  varieties,
  seasons,
}: Props) {
  const patch = (partial: Partial<ReportFormState>) => onChange({ ...state, ...partial });
  const patchValue = (key: string, value: string) =>
    onChange({ ...state, values: { ...state.values, [key]: value } });

  const sources = { producers, varieties, seasons };

  return (
    <div className="space-y-4">
      {entry.params.map((param, index) => {
        const key = `${param.kind}-${'key' in param ? param.key : 'dateRange'}-${index}`;

        if (param.kind === 'dateRange') {
          const isCustom = state.datePreset === 'custom';
          return (
            <div key={key} className="space-y-2">
              <Select
                label={param.label || 'Período'}
                options={DATE_PRESET_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
                placeholder="Selecciona un período"
                value={state.datePreset}
                onChange={(id) => {
                  const preset = String(id || 'month') as DatePreset;
                  if (preset === 'custom') {
                    patch({ datePreset: preset });
                    return;
                  }
                  const range = dateRangeForPreset(preset);
                  patch({
                    datePreset: preset,
                    dateFrom: range.dateFrom,
                    dateTo: range.dateTo,
                  });
                }}
                allowClear={false}
              />
              {!isCustom && (
                <p className="text-[11px] text-gray-500 px-0.5">
                  {state.dateFrom} → {state.dateTo}
                </p>
              )}
              {isCustom && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-0.5">Desde</label>
                    <input
                      type="date"
                      className={fieldClass}
                      value={state.dateFrom}
                      onChange={(e) =>
                        patch({ dateFrom: e.target.value, datePreset: 'custom' })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-0.5">Hasta</label>
                    <input
                      type="date"
                      className={fieldClass}
                      value={state.dateTo}
                      onChange={(e) =>
                        patch({ dateTo: e.target.value, datePreset: 'custom' })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (param.kind === 'select') {
          const options = resolveOptions(param, sources);
          const allowClear = param.allowClear !== false;
          return (
            <div key={key}>
              <Select
                label={param.label}
                options={options}
                value={state.values[param.key] || null}
                onChange={(id) =>
                  patchValue(param.key, id != null ? String(id) : '')
                }
                placeholder={param.placeholder || `Selecciona ${param.label.toLowerCase()}`}
                allowClear={allowClear}
              />
            </div>
          );
        }

        if (param.kind === 'number') {
          return (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {param.label}
              </label>
              <input
                type="number"
                min={param.min}
                max={param.max}
                className={fieldClass}
                value={state.values[param.key] ?? String(param.default ?? '')}
                onChange={(e) => patchValue(param.key, e.target.value)}
              />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
