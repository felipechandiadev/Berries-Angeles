'use client';

import DotProgress from '@/app/baseComponents/DotProgress/DotProgress';

/** Shared DataGrid load indicator: 3 dots, wave. */
export default function DataGridLoading({
  className = 'min-h-[400px]',
}: {
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      data-test-id="data-grid-loading"
      role="status"
      aria-label="Cargando"
    >
      <DotProgress variant="wave" count={3} />
    </div>
  );
}
