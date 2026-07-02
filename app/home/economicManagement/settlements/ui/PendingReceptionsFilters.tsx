'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AutoComplete, { type Option } from '@/app/baseComponents/AutoComplete/AutoComplete';

export interface PendingReceptionsFiltersProps {
  producerOptions: Option[];
  selectedProducerId?: string;
}

export default function PendingReceptionsFilters({
  producerOptions,
  selectedProducerId,
}: PendingReceptionsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedOption = useMemo(() => {
    if (!selectedProducerId) {
      return null;
    }
    return (
      producerOptions.find((option) => String(option.id) === String(selectedProducerId)) ?? null
    );
  }, [producerOptions, selectedProducerId]);

  const handleProducerChange = (option: Option | null) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (option) {
      params.set('producerId', String(option.id));
      params.set('page', '1');
    } else {
      params.delete('producerId');
      params.delete('page');
    }

    const query = params.toString();
    const targetUrl = query ? `${pathname}?${query}` : pathname;
    router.push(targetUrl, { scroll: false });
  };

  return (
    <div className="max-w-xl">
      <AutoComplete
        options={producerOptions}
        label="Productor"
        placeholder="Selecciona un productor"
        value={selectedOption}
        onChange={handleProducerChange}
        data-test-id="pending-receptions-producer"
      />
    </div>
  );
}
