'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import IconButton from '@/app/baseComponents/IconButton/IconButton';
import UpdateProducerButton from '../../ui/UpdateProducerButton';
import DeleteProducerButton from '../../ui/DeleteProducerButton';
import { ProducerDetailSectionNav } from './ProducerDetailSectionNav';
import { SummarySection } from './sections/SummarySection';
import { ReceptionsSection } from './sections/ReceptionsSection';
import { AdvancesSection } from './sections/AdvancesSection';
import { SettlementsSection } from './sections/SettlementsSection';
import { TraysSection } from './sections/TraysSection';
import { BankAccountsSection } from './sections/BankAccountsSection';
import {
  PRODUCER_DETAIL_TABS,
  producerDetailSectionFromHash,
  type ProducerDetailData,
  type ProducerDetailSectionId,
} from './producer-detail.types';

const LIST_FALLBACK = '/home/productiveManagement/producers?page=1&limit=25';

type Props = {
  data: ProducerDetailData;
};

export default function ProducerDetailPage({ data: initialData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState(initialData);
  const [activeSection, setActiveSection] = useState<ProducerDetailSectionId>('resumen');

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    const fromHash = producerDetailSectionFromHash(window.location.hash);
    if (fromHash) {
      setActiveSection(fromHash);
    }
  }, []);

  const selectSection = useCallback((id: ProducerDetailSectionId) => {
    setActiveSection(id);
    const nextHash = `#${id}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}${nextHash}`,
      );
    }
  }, []);

  const goBack = useCallback(() => {
    const returnTo = searchParams.get('returnTo')?.trim();
    if (returnTo && returnTo.startsWith('/home/productiveManagement/producers')) {
      router.push(returnTo);
      return;
    }
    router.push(LIST_FALLBACK);
  }, [router, searchParams]);

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleDeleted = useCallback(() => {
    router.push(LIST_FALLBACK);
  }, [router]);

  const producerForActions = {
    id: data.producer.id,
    name: data.producer.name,
    dni: data.producer.dni,
    mail: data.producer.mail || '',
    phone: data.producer.phone || '',
    productiveUnitId: data.producer.productiveUnitId,
    productiveUnit: data.producer.productiveUnit,
    createdAt: data.producer.createdAt as Date,
    updatedAt: data.producer.updatedAt as Date,
  };

  const sectionProps = { data, onRefresh: handleRefresh };

  return (
    <div
      className="mx-auto w-full max-w-5xl space-y-6 px-2 py-4 sm:px-4"
      data-test-id="producer-detail-root"
    >
      <header className="border-b border-border pb-4" data-test-id="producer-detail-header">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2">
            <IconButton
              icon="ArrowLeft"
              variant="basicSecondary"
              size="sm"
              onClick={goBack}
              ariaLabel="Volver a productores"
              data-test-id="producer-detail-back"
            />
            <h1
              className="min-w-0 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              title={data.producer.name}
            >
              {data.producer.name}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <UpdateProducerButton producer={producerForActions} onSuccess={handleRefresh} />
            <DeleteProducerButton producer={producerForActions} onSuccess={handleDeleted} />
          </div>
        </div>

        <p className="mt-3 font-mono text-sm text-muted-foreground" data-test-id="producer-detail-rut">
          {data.producer.dni || '—'}
        </p>
      </header>

      <ProducerDetailSectionNav
        tabs={PRODUCER_DETAIL_TABS}
        activeId={activeSection}
        onSelect={selectSection}
      />

      <div
        id={`producer-section-panel-${activeSection}`}
        role="tabpanel"
        aria-labelledby={`producer-section-tab-${activeSection}`}
        className="min-h-[16rem]"
      >
        {activeSection === 'resumen' ? <SummarySection {...sectionProps} /> : null}
        {activeSection === 'recepciones' ? <ReceptionsSection {...sectionProps} /> : null}
        {activeSection === 'anticipos' ? <AdvancesSection {...sectionProps} /> : null}
        {activeSection === 'liquidaciones' ? <SettlementsSection {...sectionProps} /> : null}
        {activeSection === 'bandejas' ? <TraysSection {...sectionProps} /> : null}
        {activeSection === 'cuentas' ? <BankAccountsSection {...sectionProps} /> : null}
      </div>
    </div>
  );
}
