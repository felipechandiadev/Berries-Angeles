'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCustomerDetailData } from '@/app/actions/customerDetail';
import type { CustomerDetailData } from '../customer-detail.types';

interface UseCustomerDetailOptions {
  customerId?: string;
  open?: boolean;
}

interface UseCustomerDetailState {
  data: CustomerDetailData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const DEFAULT_ERROR_MESSAGE = 'No fue posible obtener el detalle del cliente.';

export function useCustomerDetail({
  customerId,
  open = false,
}: UseCustomerDetailOptions): UseCustomerDetailState {
  const [data, setData] = useState<CustomerDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!customerId) {
      setData(null);
      setError('Identificador de cliente inválido.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getCustomerDetailData(customerId);

      if (!result?.success || !result.data) {
        setData(null);
        setError(result?.error || DEFAULT_ERROR_MESSAGE);
        return;
      }

      setData(result.data);
    } catch (fetchError) {
      console.error('[useCustomerDetail] Error fetching detail:', fetchError);
      setData(null);
      setError(DEFAULT_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (open && customerId) {
      void fetchDetail();
    }

    if (!open) {
      setError(null);
    }
  }, [open, customerId, fetchDetail]);

  return {
    data,
    loading,
    error,
    refetch: fetchDetail,
  };
}
