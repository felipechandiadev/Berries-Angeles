'use client';

import { Tabs } from '@felipechandiadev/ui';

const TABS = [
  { url: '/home/reports/receptions', label: 'Recepciones' },
  { url: '/home/reports/economic', label: 'Económico' },
  { url: '/home/reports/operational', label: 'Operativo' },
];

export default function ReportsTabs() {
  return <Tabs items={TABS} data-test-id="reports-tabs" />;
}
