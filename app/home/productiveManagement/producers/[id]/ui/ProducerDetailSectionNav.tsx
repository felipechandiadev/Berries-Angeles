'use client';

import type { ProducerDetailSectionId, ProducerDetailTabItem } from './producer-detail.types';

type ProducerDetailSectionNavProps = {
  tabs: ProducerDetailTabItem[];
  activeId: ProducerDetailSectionId;
  onSelect: (id: ProducerDetailSectionId) => void;
};

export function ProducerDetailSectionNav({
  tabs,
  activeId,
  onSelect,
}: ProducerDetailSectionNavProps) {
  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-border"
      aria-label="Secciones del productor"
      data-test-id="producer-detail-section-nav"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`producer-section-panel-${tab.id}`}
            id={`producer-section-tab-${tab.id}`}
            className={`cursor-pointer border-0 border-b-2 bg-transparent px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onSelect(tab.id)}
            data-test-id={`producer-detail-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
