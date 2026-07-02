import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getProductiveUnitsGridData } from '@/app/actions/productiveUnits';
import ProductiveUnitsGrid from './ui/ProductiveUnitsGrid';
import DotProgress from '@/app/baseComponents/DotProgress/DotProgress';

interface PageProps {
  searchParams?: Promise<{
    fields?: string;
    sort?: 'asc' | 'desc' | 'ASC' | 'DESC';
    sortField?: string;
    search?: string;
    filtration?: string;
    filters?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;
  
  // Normalizar parámetros: asegurar que page y limit existan
  const needsRedirect = !params?.page || !params?.limit;
  if (needsRedirect) {
    const searchParamsObj = new URLSearchParams();
    if (params?.sort) searchParamsObj.set('sort', params.sort);
    if (params?.sortField) searchParamsObj.set('sortField', params.sortField);
    if (params?.search) searchParamsObj.set('search', params.search);
    if (params?.filtration) searchParamsObj.set('filtration', params.filtration);
    if (params?.filters) searchParamsObj.set('filters', params.filters);
    if (params?.fields) searchParamsObj.set('fields', params.fields);
    searchParamsObj.set('page', params?.page || '1');
    searchParamsObj.set('limit', params?.limit || '25');
    redirect(`/home/productiveManagement/units?${searchParamsObj.toString()}`);
  }

  // Extraer y normalizar parámetros
  const sort = (params?.sort === 'asc' || params?.sort === 'ASC') ? 'ASC' : (params?.sort === 'desc' || params?.sort === 'DESC') ? 'DESC' : undefined;
  const sortField = typeof params?.sortField === 'string' ? params.sortField : undefined;
  const search = typeof params?.search === 'string' ? params.search : '';
  const filtration = params?.filtration === 'true';
  const filters = typeof params?.filters === 'string' ? params.filters : '';
  const fields = typeof params?.fields === 'string' ? params.fields : 'id,name,address,description,createdAt,updatedAt';
  const pageParam = typeof params?.page === 'string' ? params.page : '1';
  const limitParam = typeof params?.limit === 'string' ? params.limit : '25';
  const page = parseInt(pageParam) || 1;
  const limit = parseInt(limitParam) || 25;

  // Llamar al server action con los parámetros de la URL
  const result = await getProductiveUnitsGridData({
    fields,
    sortOrder: sort,
    sortBy: sortField,
    search,
    filtration,
    filters,
    page,
    limit,
  });

  const initialData = result.data;
  const totalRows = result.total;

  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[400px]"><DotProgress /></div>}>
      <div className="space-y-6">
        <ProductiveUnitsGrid 
          initialData={initialData}
          totalRows={totalRows}
          currentPage={page}
          currentLimit={limit}
          currentSort={sort}
          currentSortField={sortField}
          currentSearch={search}
          currentFilters={filters}
        />
      </div>
    </Suspense>
  );
}
