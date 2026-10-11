# Berries Angeles

App web de gestión agrícola: Next.js 15 + MySQL + PWA.

## Setup

```bash
npm install
cp .env.example .env.local   # configurar DB_PASSWORD
npm run seed:test
npm run dev
```

Login post-seed: `admin` / `1234`

## Variables de entorno

Ver `.env.example`. En Vercel configurar `DB_*`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run dev` | Desarrollo |
| `npm run build` | Producción |
| `npm run start` | Servidor producción |
| `npm run seed:test` / `seed:full` | BD + seed histórico amplio (~700 recepciones, 4 temporadas) |
| `npm run seed:minimal` | BD + fixtures JSON cortos (smoke rápido) |

Variables opcionales del seed: `SEED_PROFILE=full|minimal`, `SEED_RNG=42` (reproducible).
