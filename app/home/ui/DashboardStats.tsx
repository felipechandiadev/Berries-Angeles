'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Package,
  Sprout,
  Wallet,
  Users,
  History,
  Zap,
  PlusSquare,
  Leaf,
} from 'lucide-react';
import type { DashboardStats as DashboardStatsData } from '@/app/actions/dashboard';

type DashboardStatsProps = {
  stats: DashboardStatsData;
  userName?: string;
};

type StatCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: string;
};

const QUICK_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/home/receptions/newRecepcion', label: 'Nueva recepción', icon: PlusSquare },
  { href: '/home/receptions/receptions', label: 'Recepciones', icon: Package },
  { href: '/home/productiveManagement/producers', label: 'Productores', icon: Sprout },
  { href: '/home/storage/pallets', label: 'Pallets', icon: Package },
  { href: '/home/economicManagement/advances', label: 'Anticipos', icon: Wallet },
  { href: '/home/audit', label: 'Auditoría', icon: History },
];

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Eliminación',
  LOGIN_SUCCESS: 'Inicio de sesión',
  LOGIN_FAILED: 'Login fallido',
  LOGOUT: 'Cierre de sesión',
};

/** Node y el browser usan NBSP/narrow-NBSP distintos en es-CL; unificar evita hydration mismatch. */
function normalizeLocaleSpaces(value: string) {
  return value.replace(/[\u00a0\u202f\u2009]/g, ' ');
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return normalizeLocaleSpaces(
    new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  );
}

function StatCard({ label, value, icon: Icon, accent = 'var(--color-accent)' }: StatCardProps) {
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
          <Icon size={22} aria-hidden />
        </div>
      </div>
    </div>
  );
}

export default function DashboardStats({ stats, userName }: DashboardStatsProps) {
  const greetingName = userName?.trim() || 'equipo';
  const today = normalizeLocaleSpaces(
    new Intl.DateTimeFormat('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  );

  return (
    <div className="space-y-6" data-test-id="dashboard-stats">
      <section
        className="overflow-hidden rounded-2xl border border-neutral-200 shadow-sm"
        style={{
          background: 'linear-gradient(135deg, var(--color-accent) 0%, #245c32 55%, var(--color-secondary) 100%)',
        }}
      >
        <div className="flex flex-col gap-4 p-4 text-white sm:p-6 md:flex-row md:items-center md:justify-between">
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
              <Leaf size={16} aria-hidden />
              Temporada activa: {stats.activeSeasonName}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Recepciones" value={stats.totalReceptions} icon={Package} />
        <StatCard label="Productores" value={stats.totalProducers} icon={Sprout} accent="#5b7c1e" />
        <StatCard label="Pallets disponibles" value={stats.availablePallets} icon={Package} accent="#8b5a2b" />
        <StatCard label="Anticipos" value={stats.totalAdvances} icon={Wallet} accent="#1d4ed8" />
        <StatCard label="Usuarios" value={stats.totalUsers} icon={Users} accent="#6b7280" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6 xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">Accesos rápidos</h3>
            <Zap size={20} className="text-neutral-400" aria-hidden />
          </div>
          <div className="grid grid-cols-1 gap-2">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:border-[var(--color-secondary)] hover:bg-[#f7faf0]"
                >
                  <Icon size={20} style={{ color: 'var(--color-accent)' }} aria-hidden />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6 xl:col-span-2">
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
                    <History size={18} aria-hidden />
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
