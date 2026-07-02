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
| `npm run seed:test` | Crear BD + datos de prueba |
