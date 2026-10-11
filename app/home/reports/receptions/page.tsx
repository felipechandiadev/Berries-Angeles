import {
  listProducersForReportsAction,
  listSeasonsForReportsAction,
  listVarietiesForReportsAction,
  runReceptionReportAction,
} from '@/app/actions/reports';
import ReportsWorkspace from '../ui/ReportsWorkspace';
import { RECEPTION_REPORT_REGISTRY } from './report-registry';

export default async function ReceptionReportsPage() {
  const [producers, varieties, seasons] = await Promise.all([
    listProducersForReportsAction(),
    listVarietiesForReportsAction(),
    listSeasonsForReportsAction(),
  ]);

  return (
    <ReportsWorkspace
      registry={RECEPTION_REPORT_REGISTRY}
      producers={producers}
      varieties={varieties}
      seasons={seasons}
      runReport={runReceptionReportAction}
    />
  );
}
