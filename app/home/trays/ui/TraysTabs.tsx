'use client';

import { Tabs } from '@felipechandiadev/ui';

interface TraysTabsProps {
  typesHref: string;
  movementsHref: string;
  activeTab: 'types' | 'movements';
}

export default function TraysTabs({ typesHref, movementsHref, activeTab }: TraysTabsProps) {
  return (
    <Tabs
      items={[
        { url: typesHref, label: 'Tipos de bandejas' },
        { url: movementsHref, label: 'Transacciones' },
      ]}
      activeTab={activeTab === 'movements' ? movementsHref : typesHref}
    />
  );
}
