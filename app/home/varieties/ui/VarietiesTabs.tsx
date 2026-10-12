'use client';

import { Tabs } from '@felipechandiadev/ui';

interface VarietiesTabsProps {
  varietiesHref: string;
  qualitiesHref: string;
  activeTab: 'varieties' | 'qualities';
}

export default function VarietiesTabs({
  varietiesHref,
  qualitiesHref,
  activeTab,
}: VarietiesTabsProps) {
  return (
    <Tabs
      items={[
        { url: varietiesHref, label: 'Variedades' },
        { url: qualitiesHref, label: 'Calidades' },
      ]}
      activeTab={activeTab === 'qualities' ? qualitiesHref : varietiesHref}
    />
  );
}
