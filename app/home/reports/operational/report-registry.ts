import type { ReportRegistryEntry } from '@/lib/reports/types';

const GRANULARITY_OPTIONS = [
  { id: 'auto', label: 'Automática' },
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

export const OPERATIONAL_REPORT_REGISTRY: ReportRegistryEntry[] = [
  {
    id: 'merma-fruit-balance',
    title: 'Merma de fruta',
    description:
      'Kg netos recibidos vs despachados. Merma = recibidos − despachados (incluye stock no despachado).',
    wave: 'mvp',
    category: 'merma',
    categoryLabel: 'Merma',
    params: [
      { kind: 'dateRange', required: true, label: 'Período' },
      {
        kind: 'select',
        key: 'seasonId',
        label: 'Temporada',
        optionsSource: 'seasons',
        allowClear: true,
        placeholder: 'Todas',
      },
      {
        kind: 'select',
        key: 'granularity',
        label: 'Granularidad',
        optionsSource: 'static',
        options: GRANULARITY_OPTIONS,
        allowClear: false,
      },
    ],
  },
  {
    id: 'dispatches-by-period',
    title: 'Despachos por período',
    description: 'Totales de kg, pallets, bandejas y venta CLP en el período.',
    wave: 'mvp',
    category: 'despachos',
    categoryLabel: 'Despachos',
    params: [
      { kind: 'dateRange', required: true, label: 'Período' },
      {
        kind: 'select',
        key: 'seasonId',
        label: 'Temporada',
        optionsSource: 'seasons',
        allowClear: true,
        placeholder: 'Todas',
      },
      {
        kind: 'select',
        key: 'granularity',
        label: 'Granularidad',
        optionsSource: 'static',
        options: GRANULARITY_OPTIONS,
        allowClear: false,
      },
    ],
  },
  {
    id: 'dispatches-by-customer',
    title: 'Despachos por cliente',
    description: 'Ranking de clientes por kg y venta.',
    wave: 'mvp',
    category: 'despachos',
    categoryLabel: 'Despachos',
    params: [
      { kind: 'dateRange', required: true, label: 'Período' },
      {
        kind: 'select',
        key: 'seasonId',
        label: 'Temporada',
        optionsSource: 'seasons',
        allowClear: true,
        placeholder: 'Todas',
      },
      {
        kind: 'number',
        key: 'topN',
        label: 'Top N',
        default: 20,
        min: 1,
        max: 100,
      },
    ],
  },
  {
    id: 'trays-movements',
    title: 'Movimientos de bandejas',
    description: 'Entradas y salidas de bandejas por tipo y contraparte.',
    wave: 'mvp',
    category: 'bandejas',
    categoryLabel: 'Bandejas',
    params: [
      { kind: 'dateRange', required: true, label: 'Período' },
      {
        kind: 'select',
        key: 'granularity',
        label: 'Granularidad',
        optionsSource: 'static',
        options: GRANULARITY_OPTIONS,
        allowClear: false,
      },
      {
        kind: 'number',
        key: 'topN',
        label: 'Top N contrapartes',
        default: 20,
        min: 1,
        max: 100,
      },
    ],
  },
];
