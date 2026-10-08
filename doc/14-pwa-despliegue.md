# PWA y despliegue

## Progressive Web App (PWA)

Berries Angeles funciona como PWA instalable, permitiendo uso en dispositivos móviles y escritorio sin necesidad de app store.

### Archivos PWA

| Archivo | Función |
|---------|---------|
| `app/manifest.ts` | Web App Manifest (nombre, íconos, colores, display mode) |
| `app/sw.ts` | Service Worker con Serwist |
| `public/icons/` | Íconos PWA (192px, 512px) |
| `public/sw.js` | Service Worker generado (build time, gitignored) |

### Configuración Serwist

En `next.config.js`:

```js
const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});
```

- El service worker se **deshabilita en desarrollo** para evitar problemas de caché
- En producción, se genera en `public/sw.js` durante el build
- Usa `tsconfig.sw.json` como configuración TypeScript separada

### Manifest

Define:
- Nombre de la app: "Berries Angeles"
- Íconos para instalación
- `display: standalone` — se ve como app nativa
- Colores de tema

## Despliegue en Vercel

### Configuración (`vercel.json`)

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs20.x"
    }
  }
}
```

Las rutas API usan runtime Node.js 20 (necesario para TypeORM y mysql2).

### Variables de entorno en Vercel

| Variable | Descripción |
|----------|-------------|
| `DB_HOST` | Host de MySQL |
| `DB_PORT` | Puerto (default 3306) |
| `DB_USER` | Usuario de BD |
| `DB_PASSWORD` | Contraseña de BD |
| `DB_NAME` | Nombre de BD (`berries_angeles`) |
| `NEXTAUTH_URL` | URL de producción |
| `NEXTAUTH_SECRET` | Secreto para JWT |
| `NEXT_PUBLIC_APP_NAME` | Nombre visible de la app |

### Build

```bash
npm run build   # Next.js build + generación de service worker
npm run start   # Servidor de producción
```

El build:
1. Compila la aplicación Next.js
2. Genera el service worker con Serwist
3. Externaliza `typeorm`, `mysql2` y `bcryptjs` (no se bundlean)

## Base de datos

### MySQL

- Base de datos: `berries_angeles`
- Conexión via `mysql2` con TypeORM
- Schema creado por `data/seed/sql/create-tables.sql`
- Soft deletes en todas las entidades (`deletedAt`)

### Seed

```bash
npm run seed:test    # Crear BD + datos de prueba
```

Ejecuta `run-seed.js` → `data/seed/seed.ts` que:
1. Crea tablas si no existen
2. Carga fixtures JSON de `data/seed/dataToSeed/`
3. Crea usuario admin (`admin` / `1234`)

## Scripts disponibles

| Comando | Uso |
|---------|-----|
| `npm run dev` | Desarrollo local (sin service worker) |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run seed:test` | Inicializar BD con datos de prueba |

## Configuración local

```bash
npm install
cp .env.example .env.local
# Editar .env.local con DB_PASSWORD
npm run seed:test
npm run dev
```

La app estará en `http://localhost:3000`. Login: `admin` / `1234`.

## Dependencias externalizadas

En `next.config.js`, estas dependencias se marcan como server externals para evitar problemas de bundling:

- `typeorm` — ORM con decoradores y reflect-metadata
- `mysql2` — Driver nativo de MySQL
- `bcryptjs` — Hashing de contraseñas

## Consideraciones de producción

- El service worker cachea assets estáticos para funcionamiento offline parcial
- Las server actions requieren conexión a BD (no funcionan offline)
- La conexión a MySQL usa reintentos automáticos en `data/db.ts`
- Los timestamps usan zona horaria Chile independiente del servidor
