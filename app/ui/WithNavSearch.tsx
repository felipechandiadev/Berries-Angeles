'use client';

import { NextNavProvider } from '@felipechandiadev/ui';
import type { ReactNode } from 'react';

/** Envuelve grillas con query de servidor para DataGridTable (paginación URL). */
export function WithNavSearch({
  search,
  children,
}: {
  search: string;
  children: ReactNode;
}) {
  return <NextNavProvider search={search}>{children}</NextNavProvider>;
}
