import { TabPageLayout } from '@felipechandiadev/ui';
import ReportsTabs from './ui/ReportsTabs';

export const dynamic = 'force-dynamic';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <TabPageLayout
      title="Reportes"
      subtitle="Consultas y análisis por dominio"
      tabs={<ReportsTabs />}
      compact
      className="pb-8"
      headerClassName="print:hidden"
      data-test-id="reports-layout"
    >
      {children}
    </TabPageLayout>
  );
}
