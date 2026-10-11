'use client';

import { Tabs } from '@felipechandiadev/ui';

interface SettlementsTabsProps {
  listHref: string;
  newHref: string;
  activeTab: 'list' | 'new';
}

export default function SettlementsTabs({ listHref, newHref, activeTab }: SettlementsTabsProps) {
  return (
    <Tabs
      items={[
        { url: listHref, label: 'Liquidaciones' },
        { url: newHref, label: 'Nueva Liquidación' },
      ]}
      activeTab={activeTab === 'new' ? newHref : listHref}
    />
  );
}
