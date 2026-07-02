'use client';

import { useCallback, useMemo, useState } from 'react';
import { ReceptionDetailHeader } from './Header';
import { ReceptionDetailSidebar } from './Sidebar';
import type { ReceptionDetailData } from './types';
import {
  SummarySection,
  ProducerSection,
  TotalsSection,
  PacksSection,
  TrayReturnsSection,
  RelatedMovementsSection,
  HistorySection,
} from './sections';

interface ReceptionDetailLayoutProps {
  data: ReceptionDetailData;
  onClose: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

interface SectionConfig {
  id: string;
  label: string;
  render: React.ReactNode;
}

export function ReceptionDetailLayout({ data, onClose, onRefresh, refreshing = false }: ReceptionDetailLayoutProps) {
  const sections = useMemo<SectionConfig[]>(() => [
    {
      id: 'summary',
      label: 'Resumen',
      render: <SummarySection summary={data.summary} totals={data.totals ?? null} documents={data.documents} onRefresh={onRefresh} />,
    },
    {
      id: 'producer',
      label: 'Productor y documentos',
      render: (
        <ProducerSection
          summary={data.summary}
          producer={data.producer ?? null}
          documents={data.documents}
        />
      ),
    },
    {
      id: 'totals',
      label: 'Indicadores',
      render: <TotalsSection totals={data.totals ?? null} />,
    },
    {
      id: 'packs',
      label: 'Packs',
      render: (
        <PacksSection
          packs={data.packs}
          receptionId={data.summary.id}
          onPackDeleted={onRefresh}
        />
      ),
    },
    {
      id: 'tray-returns',
      label: 'Devoluciones de bandejas',
      render: <TrayReturnsSection trayReturns={data.trayReturns} />,
    },
    {
      id: 'related-movements',
      label: 'Movimientos relacionados',
      render: <RelatedMovementsSection groups={data.relatedMovements} />,
    },
    {
      id: 'history',
      label: 'Historial de cambios',
      render: <HistorySection history={data.history} />,
    },
  ], [data]);

  const [activeSection, setActiveSection] = useState<string>('summary');

  const activeSectionData = sections.find(section => section.id === activeSection);

  const handleSelectSection = useCallback((id: string) => {
    setActiveSection(id);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <ReceptionDetailHeader
        summary={data.summary}
        totals={data.totals ?? null}
        onClose={onClose}
      />
      <div className="flex flex-1 min-h-0 pt-4">
        <div className="w-full lg:w-56 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 pb-3 lg:pb-0 lg:pr-3 mb-4 lg:mb-0">
          <ReceptionDetailSidebar
            sections={sections.map((section) => ({ id: section.id, label: section.label }))}
            activeSection={activeSection}
            onSelect={handleSelectSection}
          />
        </div>
        <div className="flex-1 pl-0 lg:pl-6">
          <div className="h-full">
            {activeSectionData && (
              <div className="h-full">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 lg:hidden">
                  {activeSectionData.label}
                </h3>
                <div className="h-full overflow-y-auto">
                  {activeSectionData.render}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
