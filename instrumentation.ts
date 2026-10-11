/**
 * Hook de Next.js: asegura cierre del pool TypeORM al apagar el proceso.
 * Evita conexiones huérfanas tras `next dev` / HMR agresivo.
 *
 * Solo corre en runtime Node (no Edge). El import dinámico evita arrastrar
 * TypeORM al bundle edge/browser.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Import por path string + solo en nodejs (webpack no debe usar typeorm/browser).
  const mod = await import(/* webpackIgnore: true */ "./data/db");

  const shutdown = () => {
    void mod.closeDb();
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  process.once("beforeExit", shutdown);
}
