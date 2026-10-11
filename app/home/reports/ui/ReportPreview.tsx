'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/app/baseComponents/Button/Button';
import type { ReportRunResult } from '@/lib/reports/types';
import {
  formatReportCell,
  formatReportParamLabel,
  formatReportParamValue,
  formatReportSummaryLabel,
  formatReportSummaryValue,
} from '@/lib/reports/format';
import { exportReportToExcel } from '@/lib/excelExport';
import ReportCharts from './ReportCharts';
import './report-print.css';

type Props = {
  result: ReportRunResult | null;
  loading?: boolean;
  error?: string | null;
  emptyHint?: string;
};

export default function ReportPreview({
  result,
  loading,
  error,
  emptyHint = 'Selecciona un reporte y ajusta los filtros.',
}: Props) {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const onBeforePrint = () => setPrinting(true);
    const onAfterPrint = () => setPrinting(false);
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, []);

  const handlePrint = () => {
    // Montar charts con tamaño fijo antes del diálogo (ResponsiveContainer falla en print).
    setPrinting(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  };

  const handleExcel = () => {
    if (!result) return;
    exportReportToExcel(result);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Generando reporte…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        {emptyHint}
      </div>
    );
  }

  const summaryEntries = Object.entries(result.summary);

  return (
    <div className="report-print-root flex-1 min-w-0 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{result.title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Generado {new Date(result.generatedAt).toLocaleString('es-CL')}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-600">
            {Object.entries(result.params)
              .filter(([, v]) => v != null && v !== '')
              .map(([k, v]) => (
                <span key={k}>
                  <span className="text-gray-400">{formatReportParamLabel(k)}:</span>{' '}
                  {formatReportParamValue(k, v)}
                </span>
              ))}
          </div>
        </div>
        <div className="print:hidden flex gap-2">
          <Button variant="outlined" type="button" onClick={handlePrint}>
            Imprimir
          </Button>
          <Button variant="primary" type="button" onClick={handleExcel}>
            Excel
          </Button>
        </div>
      </div>

      {summaryEntries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {summaryEntries.map(([key, value]) => {
            const delta = result.summaryDelta?.[key];
            return (
              <div
                key={key}
                className="report-kpi-card rounded border border-gray-200 bg-white px-3 py-2"
              >
                <div className="text-[11px] text-gray-500">
                  {formatReportSummaryLabel(key)}
                </div>
                <div className="text-base font-semibold text-gray-900">
                  {formatReportSummaryValue(key, value)}
                </div>
                {delta && delta.deltaPct != null && (
                  <div
                    className={`text-[11px] mt-0.5 ${
                      delta.deltaPct >= 0 ? 'text-green-700' : 'text-red-600'
                    }`}
                  >
                    {delta.deltaPct >= 0 ? '+' : ''}
                    {delta.deltaPct.toFixed(1)}% vs período anterior
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ReportCharts series={result.series} printing={printing} />

      {result.columns.length > 0 && (
        <div className="report-table-wrap overflow-x-auto rounded border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {result.columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 py-2 font-medium text-gray-600 border-b ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, idx) => (
                <tr key={idx} className="odd:bg-white even:bg-gray-50/60">
                  {result.columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-1.5 border-b border-gray-100 ${
                        col.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                      }`}
                    >
                      {formatReportCell(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
              {!result.rows.length && (
                <tr>
                  <td
                    colSpan={result.columns.length}
                    className="px-3 py-6 text-center text-gray-400"
                  >
                    Sin filas para el filtro seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(result.truncated || result.footnotes?.length) && (
        <div className="text-xs text-gray-500 space-y-1">
          {result.truncated && (
            <p>Mostrando las primeras {result.rows.length} filas (resultado truncado).</p>
          )}
          {result.footnotes?.map((f, i) => (
            <p key={i}>{f}</p>
          ))}
        </div>
      )}
    </div>
  );
}
