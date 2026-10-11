'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import TopBar from '@/app/baseComponents/TopBar/TopBar';

function LoadingContent() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse text-gray-400">Cargando...</div>
    </div>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', url: '/home' },
    {
      id: 'recepcion',
      label: 'Recepción',
      children: [
        { id: 'Nueva Recepción', label: 'Nueva Recepción', url: '/home/receptions/newRecepcion' },
        { id: 'recepciones', label: 'Recepciones', url: '/home/receptions/receptions' },
      ],
    },
    {
      id: 'gestion-productiva',
      label: 'Gestión Productiva',
      children: [
        { id: 'productores', label: 'Productores', url: '/home/productiveManagement/producers' },
        { id: 'unidades-productivas', label: 'Unidades Productivas', url: '/home/productiveManagement/units' },
        { id: 'temporadas', label: 'Temporadas', url: '/home/productiveManagement/seasons' },
      ],
    },
    {
      id: 'gestion-economica',
      label: 'Gestión Económica',
      children: [
        { id: 'anticipos', label: 'Anticipos', url: '/home/economicManagement/advances' },
        { id: 'liquidaciones', label: 'Liquidaciones', url: '/home/economicManagement/settlements' },
        { id: 'cuentas-bancarias', label: 'Cuentas Bancarias', url: '/home/economicManagement/bankAccounts' },
      ],
    },
    {
      id: 'almacenamiento',
      label: 'Almacenamiento',
      children: [
        { id: 'almacenamientos', label: 'Almacenes', url: '/home/storage/storages' },
        { id: 'bandejas', label: 'Bandejas', url: '/home/storage/trays' },
        { id: 'pallets', label: 'Pallets', url: '/home/storage/pallets' },
      ],
    },
    {
      id: 'productos',
      label: 'Productos',
      children: [
        { id: 'variedades', label: 'Variedades', url: '/home/products/varieties' },
        { id: 'formatos', label: 'Formatos', url: '/home/products/formats' },
      ],
    },
    { id: 'reportes', label: 'Reportes', url: '/home/reports' },
    { id: 'usuarios', label: 'Usuarios', url: '/home/users' },
    { id: 'auditoria', label: 'Auditoría', url: '/home/audit' },
  ];

  const logoSrc = '/logo.svg';

  return (
    <div className="min-h-screen flex flex-col">
      <div className="print:hidden">
        <TopBar menuItems={menuItems} logoSrc={logoSrc} showUserButton={true} />
      </div>
      <main className="flex-1 w-full mt-[var(--app-topbar-height)] px-page pb-6 print:mt-0 print:px-0 print:pb-0">
        <Suspense fallback={<LoadingContent />}>{children}</Suspense>
      </main>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LayoutContent>{children}</LayoutContent>;
}
