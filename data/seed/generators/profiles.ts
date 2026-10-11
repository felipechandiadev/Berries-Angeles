export type SeedProfile = 'full' | 'minimal';

export function resolveSeedProfile(): SeedProfile {
  const fromEnv = (process.env.SEED_PROFILE || '').toLowerCase();
  if (fromEnv === 'minimal' || fromEnv === 'full') return fromEnv;
  const fromArg = (process.argv[3] || '').toLowerCase();
  if (fromArg === 'minimal' || fromArg === 'full') return fromArg;
  return 'full';
}

export const FULL_PROFILE = {
  receptionsBySeason: {
    '2023': 120,
    '2024': 200,
    '2025': 250,
    '2026': 130,
  } as Record<string, number>,
  activeProducerCount: 36,
  topProducerCount: 8,
  paidOnReceptionRate: 0.4,
  opsSubsetRate: 0.3,
  advancesCount: 50,
  settledReceptionsCount: 20,
  settledAdvancesCount: 15,
  clientTrayMoves: 12,
  palletTarget: 30,
} as const;

export const SEASON_DEFS = [
  {
    id: '8d046823-7777-4a00-f006-000000000003',
    year: '2023',
    name: 'Temporada 2023',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    active: false,
  },
  {
    id: '8d046823-7777-4a00-f006-000000000002',
    year: '2024',
    name: 'Temporada 2024',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    active: false,
  },
  {
    id: '8d046823-7777-4a00-f006-000000000001',
    year: '2025',
    name: 'Temporada 2025',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    active: false,
  },
  {
    id: '8d046823-7777-4a00-f006-000000000004',
    year: '2026',
    name: 'Temporada 2026',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    active: true,
  },
] as const;

export const VARIETY_TRAY: Record<string, string> = {
  'FRAMBUESA ORGANICA': 'AZUL',
  'ARANDANO ORGANICO': 'ARANDANERA',
  'MORA ORGANICA': 'NEGRA CHICA',
  'ESPARRAGOS ORGANICOS': 'ESPARRAGUERA',
};

export const USER_NAMES = ['admin', 'test_admin', 'operador.norte'] as const;
