'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Select from '@/app/baseComponents/Select/Select';
import type { ReportOption, ReportRegistryEntry, ReportRunResult } from '@/lib/reports/types';
import {
  applyEntryDefaults,
  emptyReportFormState,
  formStateToParams,
  validateFormForEntry,
  type ReportFormState,
} from '@/lib/reports/form';
import ReportParamsForm from './ReportParamsForm';
import ReportPreview from './ReportPreview';

type RunReportFn = (
  reportId: string,
  params: Record<string, unknown>
) => Promise<{ success: boolean; data?: ReportRunResult; error?: string }>;

type Props = {
  registry: ReportRegistryEntry[];
  producers: ReportOption[];
  varieties: ReportOption[];
  seasons: ReportOption[];
  runReport: RunReportFn;
};

export default function ReportsWorkspace({
  registry,
  producers,
  varieties,
  seasons,
  runReport,
}: Props) {
  const categories = useMemo(() => {
    const map = new Map<string, { label: string; entries: ReportRegistryEntry[] }>();
    registry.forEach((entry) => {
      const cur = map.get(entry.category) ?? {
        label: entry.categoryLabel || entry.category,
        entries: [],
      };
      if (entry.categoryLabel) cur.label = entry.categoryLabel;
      cur.entries.push(entry);
      map.set(entry.category, cur);
    });
    return Array.from(map.entries()).map(([id, data]) => ({
      id,
      label: data.label,
      entries: data.entries,
    }));
  }, [registry]);

  const [category, setCategory] = useState(categories[0]?.id ?? '');
  const entriesInCategory =
    categories.find((c) => c.id === category)?.entries ?? [];
  const [reportId, setReportId] = useState(entriesInCategory[0]?.id ?? '');
  const entry = registry.find((r) => r.id === reportId) ?? entriesInCategory[0] ?? null;

  const [form, setForm] = useState<ReportFormState>(() =>
    entry ? applyEntryDefaults(entry, emptyReportFormState()) : emptyReportFormState()
  );
  const [result, setResult] = useState<ReportRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!entriesInCategory.some((e) => e.id === reportId)) {
      setReportId(entriesInCategory[0]?.id ?? '');
    }
  }, [category, entriesInCategory, reportId]);

  useEffect(() => {
    if (!entry) return;
    setForm((prev) => applyEntryDefaults(entry, prev));
  }, [entry?.id]);

  useEffect(() => {
    if (!entry) return;

    const validationError = validateFormForEntry(entry, form);
    if (validationError) {
      setError(validationError);
      setResult(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = formStateToParams(entry, form);
      if (params.varietyId) {
        const variety = varieties.find((v) => String(v.id) === String(params.varietyId));
        if (variety) params.varietyName = variety.label;
      }

      const reqId = ++requestIdRef.current;
      startTransition(async () => {
        setError(null);
        try {
          const res = await runReport(entry.id, params);
          if (reqId !== requestIdRef.current) return;
          if (!res.success || !res.data) {
            setResult(null);
            setError(res.error || 'No se pudo generar el reporte.');
            return;
          }
          setResult(res.data);
        } catch (e: any) {
          if (reqId !== requestIdRef.current) return;
          setResult(null);
          setError(e?.message || 'Error al generar el reporte.');
        }
      });
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [entry, form, runReport, varieties]);

  const categoryOptions = categories.map((c) => ({ id: c.id, label: c.label }));
  const reportOptions = entriesInCategory.map((e) => ({ id: e.id, label: e.title }));

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[70vh]">
      <aside className="print:hidden w-full lg:w-72 shrink-0 space-y-4 rounded border border-gray-200 bg-gray-50 p-3">
        <div>
          <Select
            label="Categoría"
            options={categoryOptions}
            placeholder="Selecciona una categoría"
            value={category || null}
            onChange={(id) => setCategory(String(id || ''))}
            allowClear={false}
          />
        </div>

        <div>
          <Select
            label="Tipo de reporte"
            options={reportOptions}
            placeholder="Selecciona un reporte"
            value={reportId || null}
            onChange={(id) => setReportId(String(id || ''))}
            allowClear={false}
          />
          {entry?.description && (
            <p className="mt-1 text-[11px] text-gray-500">{entry.description}</p>
          )}
        </div>

        {entry && (
          <div>
            <div className="text-xs font-medium text-gray-600 mb-2">Parámetros</div>
            <ReportParamsForm
              entry={entry}
              state={form}
              onChange={setForm}
              producers={producers}
              varieties={varieties}
              seasons={seasons}
            />
          </div>
        )}
      </aside>

      <ReportPreview result={result} loading={isPending} error={error} />
    </div>
  );
}
