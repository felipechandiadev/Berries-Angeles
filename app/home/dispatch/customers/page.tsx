import React, { Suspense } from 'react';
import DotProgress from '@/app/baseComponents/DotProgress/DotProgress';
import { getCustomers } from '@/app/actions/customers';
import CustomersGrid from './ui/CustomersGrid';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const result = await getCustomers();

  if (!result.success) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-foreground">Error al cargar clientes</h2>
          <p className="text-secondary">{result.error}</p>
        </div>
      </div>
    );
  }

  const customers = Array.isArray(result.data) ? result.data : [];

  return (
    <div data-test-id="customers-page">
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <DotProgress />
          </div>
        }
      >
        <CustomersGrid customers={customers as any[]} />
      </Suspense>
    </div>
  );
}
