import type { ReportRegistryEntry } from '@/lib/reports/types';

const GRANULARITY_OPTIONS = [
  { id: 'auto', label: 'Automática' },
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

const COMPARE_OPTIONS = [
  { id: 'none', label: 'Sin comparación' },
  { id: 'previousPeriod', label: 'Período anterior' },
  { id: 'samePeriodLastYear', label: 'Mismo lapso año pasado' },
];

const PAYMENT_STATUS_OPTIONS = [
  { id: 'PENDING', label: 'Pendiente' },
  { id: 'PAID_ON_RECEPTION', label: 'Pagada' },
];

export const RECEPTION_REPORT_REGISTRY: ReportRegistryEntry[] = [
  {
    id: 'receptions-by-period',
    title: 'Resumen de recepciones',
    description: 'Totales de kg, bandejas y montos en el período.',
    wave: 'mvp',
    category: 'resumen',
    categoryLabel: 'Resumen',
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
      {
        kind: 'select',
        key: 'compareWith',
        label: 'Comparar con',
        optionsSource: 'static',
        options: COMPARE_OPTIONS,
        allowClear: false,
      },
    ],
  },
  {
    id: 'receptions-by-producer',
    title: 'Por productor',
    description: 'Ranking de productores por kg y montos.',
    wave: 'mvp',
    category: 'productores',
    categoryLabel: 'Productores',
    params: [
      { kind: 'dateRange', required: true, label: 'Período' },
      {
        kind: 'select',
        key: 'producerId',
        label: 'Productor',
        optionsSource: 'producers',
        allowClear: true,
        placeholder: 'Todos',
      },
      {
        kind: 'number',
        key: 'topN',
        label: 'Top N',
        default: 20,
        min: 1,
        max: 100,
      },
      {
        kind: 'select',
        key: 'seasonId',
        label: 'Temporada',
        optionsSource: 'seasons',
        allowClear: true,
        placeholder: 'Todas',
      },
    ],
  },
  {
    id: 'receptions-by-variety',
    title: 'Por variedad',
    description: 'Distribución de kg y montos por variedad.',
    wave: 'mvp',
    category: 'calidad',
    categoryLabel: 'Calidad',
    params: [
      { kind: 'dateRange', required: true, label: 'Período' },
      {
        kind: 'select',
        key: 'varietyId',
        label: 'Variedad',
        optionsSource: 'varieties',
        allowClear: true,
        placeholder: 'Todas',
      },
      {
        kind: 'select',
        key: 'seasonId',
        label: 'Temporada',
        optionsSource: 'seasons',
        allowClear: true,
        placeholder: 'Todas',
      },
    ],
  },
  {
    id: 'receptions-payment-status',
    title: 'Estado de pago',
    description: 'Recepciones pagadas contra recepción vs pendientes.',
    wave: 'mvp',
    category: 'pagos',
    categoryLabel: 'Pagos',
    params: [
      { kind: 'dateRange', required: true, label: 'Período' },
      {
        kind: 'select',
        key: 'paymentStatus',
        label: 'Estado de pago',
        optionsSource: 'static',
        options: PAYMENT_STATUS_OPTIONS,
        allowClear: true,
        placeholder: 'Todos',
      },
      {
        kind: 'select',
        key: 'seasonId',
        label: 'Temporada',
        optionsSource: 'seasons',
        allowClear: true,
        placeholder: 'Todas',
      },
    ],
  },
];
