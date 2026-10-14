'use server';

import { getProducersSimpleListWithLabel } from '@/app/actions/producers';
import { getVarietiesSimpleList } from '@/app/actions/varieties';
import { getSeasons } from '@/app/actions/seasons';
import { RECEPTION_REPORT_HANDLERS } from '@/lib/reports/handlers/receptions';
import { OPERATIONAL_REPORT_HANDLERS } from '@/lib/reports/handlers/operational';
import { ECONOMIC_REPORT_HANDLERS } from '@/lib/reports/handlers/economic';
import { handlersToMap, runReport } from '@/lib/reports/runner';
import type { ReportOption, ReportRunResult } from '@/lib/reports/types';

const receptionHandlers = handlersToMap(RECEPTION_REPORT_HANDLERS);
const operationalHandlers = handlersToMap(OPERATIONAL_REPORT_HANDLERS);
const economicHandlers = handlersToMap(ECONOMIC_REPORT_HANDLERS);

export async function runReceptionReportAction(
  reportId: string,
  params: Record<string, unknown>
): Promise<{ success: boolean; data?: ReportRunResult; error?: string }> {
  try {
    const enriched = { ...params };
    if (enriched.varietyId && !enriched.varietyName) {
      const varieties = await getVarietiesSimpleList();
      const match = varieties.find((v) => String(v.id) === String(enriched.varietyId));
      if (match) enriched.varietyName = match.label;
    }

    const data = await runReport(receptionHandlers, reportId, enriched);
    return { success: true, data };
  } catch (error: any) {
    console.error('[runReceptionReportAction]', error);
    return {
      success: false,
      error: error?.message || 'Error al generar el reporte',
    };
  }
}

export async function runOperationalReportAction(
  reportId: string,
  params: Record<string, unknown>
): Promise<{ success: boolean; data?: ReportRunResult; error?: string }> {
  try {
    const data = await runReport(operationalHandlers, reportId, params);
    return { success: true, data };
  } catch (error: any) {
    console.error('[runOperationalReportAction]', error);
    return {
      success: false,
      error: error?.message || 'Error al generar el reporte',
    };
  }
}

export async function runEconomicReportAction(
  reportId: string,
  params: Record<string, unknown>
): Promise<{ success: boolean; data?: ReportRunResult; error?: string }> {
  try {
    const data = await runReport(economicHandlers, reportId, params);
    return { success: true, data };
  } catch (error: any) {
    console.error('[runEconomicReportAction]', error);
    return {
      success: false,
      error: error?.message || 'Error al generar el reporte',
    };
  }
}

export async function listProducersForReportsAction(): Promise<ReportOption[]> {
  try {
    return await getProducersSimpleListWithLabel();
  } catch (error) {
    console.error('[listProducersForReportsAction]', error);
    return [];
  }
}

export async function listVarietiesForReportsAction(): Promise<ReportOption[]> {
  try {
    const rows = await getVarietiesSimpleList();
    return rows.map((v) => ({ id: String(v.id), label: v.label }));
  } catch (error) {
    console.error('[listVarietiesForReportsAction]', error);
    return [];
  }
}

export async function listSeasonsForReportsAction(): Promise<ReportOption[]> {
  try {
    const result = await getSeasons();
    if (!result.success || !result.data) return [];
    const seasons = Array.isArray(result.data) ? result.data : [result.data];
    return seasons.map((s: any) => ({
      id: String(s.id),
      label: s.name || `Temporada ${s.id}`,
    }));
  } catch (error) {
    console.error('[listSeasonsForReportsAction]', error);
    return [];
  }
}
