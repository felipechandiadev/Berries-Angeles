'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import TopBar from '@/app/baseComponents/TopBar/TopBar';

function LoadingContent() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse text-gray-400">Cargando...</div>
    </div>
  );
}

const routeTitles = [
  { route: '/home', title: 'Dashboard' },
  { route: '/home/users', title: 'Usuarios' },
  { route: '/home/audit', title: 'Auditoría' },
  { route: '/home/storage/storages', title: 'Almacenamientos' },
  { route: '/home/productiveManagement/seasons', title: 'Temporadas' },
  { route: '/home/storage/trays', title: 'Bandejas' },
  { route: '/home/storage/pallets', title: 'Pallets' },
  { route: '/home/products/varieties', title: 'Variedades' },
  { route: '/home/products/formats', title: 'Formatos' },
  { route: '/home/economicManagement/advances', title: 'Anticipos' },
  { route: '/home/economicManagement/settlements', title: 'Liquidaciones' },
  { route: '/home/economicManagement/bankAccounts', title: 'Cuentas Bancarias' },
  { route: '/home/receptions/newRecepcion', title: 'Nueva Recepción' },
  { route: '/home/receptions/receptions', title: 'Recepciones' },
  { route: '/home/reports', title: 'Reportes' },
  { route: '/home/reports/receptions', title: 'Reportes' },
  { route: '/home/reports/economic', title: 'Reportes' },
  { route: '/home/reports/operational', title: 'Reportes' },
  { route: '/home/productiveManagement/producers', title: 'Productores' },
  { route: '/home/productiveManagement/units', title: 'Unidades Productivas' },

];

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', url: '/home' },
    {
      id: 'recepcion',
      label: 'Recepción',
      children: [
        { id: 'Nueva Recepción', label: 'Nueva Recepción', url: '/home/receptions/newRecepcion' },
        { id: 'recepciones', label: 'Recepciones', url: '/home/receptions/receptions' },
      ]
    },
    {
      id: 'gestion-productiva',
      label: 'Gestión Productiva',
      children: [
        { id: 'productores', label: 'Productores', url: '/home/productiveManagement/producers' },
        { id: 'unidades-productivas', label: 'Unidades Productivas', url: '/home/productiveManagement/units' },
        { id: 'temporadas', label: 'Temporadas', url: '/home/productiveManagement/seasons' },
      ]
    },
    {
      id: 'gestion-economica',
      label: 'Gestión Económica',
      children: [
        { id: 'anticipos', label: 'Anticipos', url: '/home/economicManagement/advances' },
        { id: 'liquidaciones', label: 'Liquidaciones', url: '/home/economicManagement/settlements' },
        {id:'cuentas-bancarias', label: 'Cuentas Bancarias', url: '/home/economicManagement/bankAccounts' },
      ]
    },
    {
      id: 'almacenamiento',
      label: 'Almacenamiento',
      children: [
        { id: 'almacenamientos', label: 'Almacenes', url: '/home/storage/storages' },
        { id: 'bandejas', label: 'Bandejas', url: '/home/storage/trays' },
        { id: 'pallets', label: 'Pallets', url: '/home/storage/pallets' }
      ]
    },
    {
      id: 'productos',
      label: 'Productos',
      children: [
        { id: 'variedades', label: 'Variedades', url: '/home/products/varieties' },
        { id: 'formatos', label: 'Formatos', url: '/home/products/formats' },
      ]
    },
    { id: 'reportes', label: 'Reportes', url: '/home/reports' },
    { id: 'usuarios', label: 'Usuarios', url: '/home/users' },
    { id: 'auditoria', label: 'Auditoría', url: '/home/audit' },
  ];

  const logoSrc = '/logo.svg';

  // Determinar el título basado en la ruta actual
  const currentTitle = routeTitles.find(item => pathname === item.route)?.title || 'Home';

  return (
    <div className="min-h-screen flex flex-col">
      <div className="print:hidden">
        <TopBar title={currentTitle} menuItems={menuItems} logoSrc={logoSrc} showUserButton={true} />
      </div>
      <main className="flex-1 w-full mt-20 px-8 print:mt-0 print:px-0">
        <Suspense fallback={<LoadingContent />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LayoutContent>{children}</LayoutContent>;
}
