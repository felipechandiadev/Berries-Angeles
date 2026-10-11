'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/home/reports/receptions', label: 'Recepciones' },
  { href: '/home/reports/economic', label: 'Económico' },
  { href: '/home/reports/operational', label: 'Operativo' },
] as const;

export default function ReportsTabs() {
  const pathname = usePathname();

  return (
    <nav className="print:hidden flex gap-1 border-b border-gray-200 mb-4">
      {TABS.map((tab) => {
        const active = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active
                ? 'border-[var(--color-primary,#1F4E78)] text-[var(--color-primary,#1F4E78)]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
