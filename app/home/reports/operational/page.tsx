import {
  listSeasonsForReportsAction,
  runOperationalReportAction,
} from '@/app/actions/reports';
import ReportsWorkspace from '../ui/ReportsWorkspace';
import { OPERATIONAL_REPORT_REGISTRY } from './report-registry';

export default async function OperationalReportsPage() {
  const seasons = await listSeasonsForReportsAction();

  return (
    <ReportsWorkspace
      registry={OPERATIONAL_REPORT_REGISTRY}
      producers={[]}
      varieties={[]}
      seasons={seasons}
      runReport={runOperationalReportAction}
    />
  );
}
