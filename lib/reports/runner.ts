import type { ReportHandler, ReportHandlerContext, ReportRunResult } from './types';

export async function runReport(
  handlers: Map<string, ReportHandler>,
  reportId: string,
  params: Record<string, unknown>
): Promise<ReportRunResult> {
  const handler = handlers.get(reportId);
  if (!handler) {
    throw new Error(`Reporte desconocido: ${reportId}`);
  }
  const validated = handler.validate(params);
  const ctx: ReportHandlerContext = { params: validated };
  return handler.run(ctx);
}

export function handlersToMap(list: ReportHandler[]): Map<string, ReportHandler> {
  return new Map(list.map((h) => [h.id, h]));
}
