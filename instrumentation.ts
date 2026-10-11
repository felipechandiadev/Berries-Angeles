/**
 * Hook de Next.js: cierra el pool TypeORM al apagar el proceso.
 *
 * No importamos `./data/db` aquí:
 * - con `webpackIgnore`, Node busca el módulo bajo `.next/server/` y falla;
 * - sin él, webpack intenta empaquetar TypeORM/mysql2 en instrumentation y rompe.
 *
 * El DataSource vive en `globalThis.__berriesAngelesTypeormDs` (ver data/db.ts).
 */
const GLOBAL_KEY = "__berriesAngelesTypeormDs";

type DbBag = {
  ds?: { isInitialized?: boolean; destroy: () => Promise<void> };
  initPromise?: unknown;
};

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const shutdown = () => {
    const bag = (globalThis as Record<string, DbBag | undefined>)[GLOBAL_KEY];
    if (!bag) return;

    const ds = bag.ds;
    bag.initPromise = undefined;
    bag.ds = undefined;

    if (ds?.isInitialized) {
      void ds.destroy().catch(() => {
        /* ignore shutdown errors */
      });
    }
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  process.once("beforeExit", shutdown);
}
