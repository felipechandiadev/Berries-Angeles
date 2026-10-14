'use client';

import type {
  CustomerDetailSectionId,
  CustomerDetailTabItem,
} from '../customer-detail.types';

type CustomerDetailSectionNavProps = {
  tabs: CustomerDetailTabItem[];
  activeId: CustomerDetailSectionId;
  onSelect: (id: CustomerDetailSectionId) => void;
};

export function CustomerDetailSectionNav({
  tabs,
  activeId,
  onSelect,
}: CustomerDetailSectionNavProps) {
  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-border"
      aria-label="Secciones del cliente"
      data-test-id="customer-detail-section-nav"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`customer-section-panel-${tab.id}`}
            id={`customer-section-tab-${tab.id}`}
            className={`cursor-pointer border-0 border-b-2 bg-transparent px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onSelect(tab.id)}
            data-test-id={`customer-detail-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
