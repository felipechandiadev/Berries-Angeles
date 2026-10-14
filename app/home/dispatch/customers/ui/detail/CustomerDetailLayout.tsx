'use client';

import { useCallback, useEffect, useState } from 'react';
import UpdateCustomerButton from '../UpdateCustomerButton';
import DeleteCustomerButton from '../DeleteCustomerButton';
import { CustomerDetailSectionNav } from './CustomerDetailSectionNav';
import { SummarySection } from './sections/SummarySection';
import { DispatchesSection } from './sections/DispatchesSection';
import { TraysSection } from './sections/TraysSection';
import { BankAccountsSection } from './sections/BankAccountsSection';
import {
  CUSTOMER_DETAIL_TABS,
  type CustomerDetailData,
  type CustomerDetailSectionId,
} from '../customer-detail.types';

type Props = {
  data: CustomerDetailData;
  onRefresh: () => void;
  onDeleted: () => void;
};

export default function CustomerDetailLayout({ data: initialData, onRefresh, onDeleted }: Props) {
  const [data, setData] = useState(initialData);
  const [activeSection, setActiveSection] = useState<CustomerDetailSectionId>('resumen');

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const selectSection = useCallback((id: CustomerDetailSectionId) => {
    setActiveSection(id);
  }, []);

  const customerForActions = {
    id: data.customer.id,
    name: data.customer.name,
    dni: data.customer.dni,
    mail: data.customer.mail || '',
    phone: data.customer.phone || '',
    personId: data.customer.personId,
  };

  const sectionProps = { data, onRefresh };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col space-y-4 overflow-auto px-1 py-2"
      data-test-id="customer-detail-root"
    >
      <header className="border-b border-border pb-4" data-test-id="customer-detail-header">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              className="min-w-0 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              title={data.customer.name}
            >
              {data.customer.name}
            </h2>
            <p
              className="mt-2 font-mono text-sm text-muted-foreground"
              data-test-id="customer-detail-rut"
            >
              {data.customer.dni || '—'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <UpdateCustomerButton customer={customerForActions} onSuccess={onRefresh} />
            <DeleteCustomerButton customer={customerForActions} onSuccess={onDeleted} />
          </div>
        </div>
      </header>

      <CustomerDetailSectionNav
        tabs={CUSTOMER_DETAIL_TABS}
        activeId={activeSection}
        onSelect={selectSection}
      />

      <div
        id={`customer-section-panel-${activeSection}`}
        role="tabpanel"
        aria-labelledby={`customer-section-tab-${activeSection}`}
        className="min-h-[16rem] flex-1"
      >
        {activeSection === 'resumen' ? <SummarySection {...sectionProps} /> : null}
        {activeSection === 'despachos' ? <DispatchesSection {...sectionProps} /> : null}
        {activeSection === 'bandejas' ? <TraysSection {...sectionProps} /> : null}
        {activeSection === 'cuentas' ? <BankAccountsSection {...sectionProps} /> : null}
      </div>
    </div>
  );
}
