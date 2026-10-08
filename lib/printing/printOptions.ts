/**
 * Reception ticket print options / presets.
 * Persisted in localStorage so the last choice sticks across sessions.
 */

export type ReceptionPrintProfile = 'classic' | 'producer' | 'warehouse' | 'full';

export interface ReceptionPrintOptions {
  profile: ReceptionPrintProfile;
  showLogo: boolean;
  showPallets: boolean;
  showPackDetails: boolean;
  showPrices: boolean;
  showTrayDevolutions: boolean;
  showGuideDriver: boolean;
}

export const PRINT_PROFILE_LABELS: Record<ReceptionPrintProfile, string> = {
  classic: 'Clásico',
  producer: 'Productor',
  warehouse: 'Bodega',
  full: 'Completo',
};

const VALID_PROFILES = new Set<ReceptionPrintProfile>([
  'classic',
  'producer',
  'warehouse',
  'full',
]);

const STORAGE_KEY = 'berries.receptionPrintOptions';

const PROFILE_DEFAULTS: Record<
  ReceptionPrintProfile,
  Omit<ReceptionPrintOptions, 'profile'>
> = {
  classic: {
    showLogo: true,
    showPallets: false,
    showPackDetails: false,
    showPrices: true,
    showTrayDevolutions: true,
    showGuideDriver: true,
  },
  producer: {
    showLogo: true,
    showPallets: false,
    showPackDetails: false,
    showPrices: true,
    showTrayDevolutions: true,
    showGuideDriver: false,
  },
  warehouse: {
    showLogo: true,
    showPallets: true,
    showPackDetails: true,
    showPrices: false,
    showTrayDevolutions: true,
    showGuideDriver: true,
  },
  full: {
    showLogo: true,
    showPallets: true,
    showPackDetails: true,
    showPrices: true,
    showTrayDevolutions: true,
    showGuideDriver: true,
  },
};

/** Default: Clásico (ticket tipo Maugro histórico). */
export function getDefaultReceptionPrintOptions(): ReceptionPrintOptions {
  return { profile: 'classic', ...PROFILE_DEFAULTS.classic };
}

export function applyPrintProfile(profile: ReceptionPrintProfile): ReceptionPrintOptions {
  return { profile, ...PROFILE_DEFAULTS[profile] };
}

function normalizeProfile(value: unknown): ReceptionPrintProfile {
  if (typeof value === 'string' && VALID_PROFILES.has(value as ReceptionPrintProfile)) {
    return value as ReceptionPrintProfile;
  }
  return 'classic';
}

export function loadReceptionPrintOptions(): ReceptionPrintOptions {
  if (typeof window === 'undefined') {
    return getDefaultReceptionPrintOptions();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultReceptionPrintOptions();
    const parsed = JSON.parse(raw) as Partial<ReceptionPrintOptions>;
    const profile = normalizeProfile(parsed.profile);
    const base = applyPrintProfile(profile);
    return {
      profile,
      showLogo: typeof parsed.showLogo === 'boolean' ? parsed.showLogo : base.showLogo,
      showPallets: typeof parsed.showPallets === 'boolean' ? parsed.showPallets : base.showPallets,
      showPackDetails:
        typeof parsed.showPackDetails === 'boolean' ? parsed.showPackDetails : base.showPackDetails,
      showPrices: typeof parsed.showPrices === 'boolean' ? parsed.showPrices : base.showPrices,
      showTrayDevolutions:
        typeof parsed.showTrayDevolutions === 'boolean'
          ? parsed.showTrayDevolutions
          : base.showTrayDevolutions,
      showGuideDriver:
        typeof parsed.showGuideDriver === 'boolean' ? parsed.showGuideDriver : base.showGuideDriver,
    };
  } catch {
    return getDefaultReceptionPrintOptions();
  }
}

export function saveReceptionPrintOptions(options: ReceptionPrintOptions): void {
  if (typeof window === 'undefined') return;
  try {
    const profile = normalizeProfile(options.profile);
    const payload: ReceptionPrintOptions = {
      profile,
      showLogo: Boolean(options.showLogo),
      showPallets: Boolean(options.showPallets),
      showPackDetails: Boolean(options.showPackDetails),
      showPrices: Boolean(options.showPrices),
      showTrayDevolutions: Boolean(options.showTrayDevolutions),
      showGuideDriver: Boolean(options.showGuideDriver),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export interface AggregatedPalletLine {
  palletId: number;
  traysAssigned: number;
  grossWeightKg: number;
  packNumbers: number[];
}

export function aggregatePalletLines(
  packs: Array<{
    packNumber?: number | null;
    palletAssignments?: Array<{
      palletId?: number;
      traysAssigned?: number;
      grossWeightKg?: number;
    }> | null;
  }>
): AggregatedPalletLine[] {
  const map = new Map<number, AggregatedPalletLine>();

  packs.forEach((pack, index) => {
    const packNumber = pack.packNumber || index + 1;
    const assignments = Array.isArray(pack.palletAssignments) ? pack.palletAssignments : [];
    assignments.forEach((assignment) => {
      const palletId = Number(assignment.palletId);
      const trays = Number(assignment.traysAssigned ?? 0);
      const gross = Number(assignment.grossWeightKg ?? 0);
      if (!Number.isFinite(palletId) || palletId <= 0 || !(trays > 0)) return;

      const current = map.get(palletId) ?? {
        palletId,
        traysAssigned: 0,
        grossWeightKg: 0,
        packNumbers: [],
      };
      current.traysAssigned += trays;
      if (Number.isFinite(gross) && gross > 0) {
        current.grossWeightKg += gross;
      }
      if (!current.packNumbers.includes(packNumber)) {
        current.packNumbers.push(packNumber);
      }
      map.set(palletId, current);
    });
  });

  return Array.from(map.values()).sort((a, b) => a.palletId - b.palletId);
}
