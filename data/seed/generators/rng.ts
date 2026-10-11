/** Deterministic PRNG (mulberry32). */
export type Rng = () => number;

export function createRng(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function resolveSeedRng(): number {
  const raw = process.env.SEED_RNG;
  if (raw == null || raw === '') return 42;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : 42;
}

export function pick<T>(rng: Rng, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function pickWeighted<T>(rng: Rng, items: T[], weights: number[]): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

export function intBetween(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function floatBetween(rng: Rng, min: number, max: number, digits = 2): number {
  const v = min + rng() * (max - min);
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}
