'use client';

import Link from 'next/link';
import type { DashboardStats as DashboardStatsData } from '@/app/actions/dashboard';

type DashboardStatsProps = {
  stats: DashboardStatsData;
  userName?: string;
};

type StatCardProps = {
  label: string;
  value: number | string;
  icon: string;
  accent?: string;
};

const QUICK_LINKS = [
  { href: '/home/receptions/newRecepcion', label: 'Nueva recepción', icon: 'add_box' },
  { href: '/home/receptions/receptions', label: 'Recepciones', icon: 'inventory_2' },
  { href: '/home/productiveManagement/producers', label: 'Productores', icon: 'agriculture' },
  { href: '/home/storage/pallets', label: 'Pallets', icon: 'package_2' },
  { href: '/home/economicManagement/advances', label: 'Anticipos', icon: 'payments' },
  { href: '/home/audit', label: 'Auditoría', icon: 'history' },
];

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Eliminación',
  LOGIN_SUCCESS: 'Inicio de sesión',
  LOGIN_FAILED: 'Login fallido',
  LOGOUT: 'Cierre de sesión',
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function StatCard({ label, value, icon, accent = 'var(--color-accent)' }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">{value}</p>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardStats({ stats, userName }: DashboardStatsProps) {
  const greetingName = userName?.trim() || 'equipo';
  const today = new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6" data-test-id="dashboard-stats">
      <section
        className="overflow-hidden rounded-2xl border border-neutral-200 shadow-sm"
        style={{
          background: 'linear-gradient(135deg, var(--color-accent) 0%, #245c32 55%, var(--color-secondary) 100%)',
        }}
      >
        <div className="flex flex-col gap-4 p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-sm font-medium text-white/80 capitalize">{today}</p>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">
              Hola, {greetingName}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/85 md:text-base">
              Resumen operativo de Berries Angeles: recepciones, productores, bodega y movimientos recientes.
            </p>
          </div>
          {stats.activeSeasonName && (
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              <span className="material-symbols-outlined text-base">eco</span>
              Temporada activa: {stats.activeSeasonName}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Recepciones" value={stats.totalReceptions} icon="inventory_2" />
        <StatCard label="Productores" value={stats.totalProducers} icon="agriculture" accent="#5b7c1e" />
        <StatCard label="Pallets disponibles" value={stats.availablePallets} icon="package_2" accent="#8b5a2b" />
        <StatCard label="Anticipos" value={stats.totalAdvances} icon="payments" accent="#1d4ed8" />
        <StatCard label="Usuarios" value={stats.totalUsers} icon="group" accent="#6b7280" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Accesos rápidos</h3>
            <span className="material-symbols-outlined text-neutral-400">bolt</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:border-[var(--color-secondary)] hover:bg-[#f7faf0]"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ color: 'var(--color-accent)' }}
                >
                  {link.icon}
                </span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Actividad reciente</h3>
            <Link
              href="/home/audit"
              className="text-sm font-medium"
              style={{ color: 'var(--color-accent)' }}
            >
              Ver todo
            </Link>
          </div>

          {stats.recentActivity.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 px-4 py-10 text-center text-sm text-neutral-500">
              Aún no hay actividad registrada en auditoría.
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3"
                >
                  <div
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: '#17321D14', color: 'var(--color-accent)' }}
                  >
                    <span className="material-symbols-outlined text-[18px]">history</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900">
                        {ACTION_LABELS[item.action] ?? item.action}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-neutral-500">
                        {item.entityName}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{item.description}</p>
                    <p className="mt-1 text-xs text-neutral-400">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
