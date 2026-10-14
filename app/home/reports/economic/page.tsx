import {
  listProducersForReportsAction,
  listSeasonsForReportsAction,
  runEconomicReportAction,
} from '@/app/actions/reports';
import ReportsWorkspace from '../ui/ReportsWorkspace';
import { ECONOMIC_REPORT_REGISTRY } from './report-registry';

export default async function EconomicReportsPage() {
  const [producers, seasons] = await Promise.all([
    listProducersForReportsAction(),
    listSeasonsForReportsAction(),
  ]);

  return (
    <ReportsWorkspace
      registry={ECONOMIC_REPORT_REGISTRY}
      producers={producers}
      varieties={[]}
      seasons={seasons}
      runReport={runEconomicReportAction}
    />
  );
}
