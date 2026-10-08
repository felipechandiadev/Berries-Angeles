# Arquitectura general

## Tipo de proyecto

Berries Angeles es una **aplicación web monolítica** (un solo repositorio, un solo `package.json`, un solo despliegue). No es un monorepo. Se despliega como PWA en **Vercel** con runtime Node.js 20 para las rutas API.

## Capas de la aplicación

```
┌─────────────────────────────────────────────────────────────┐
│                     Navegador (PWA)                          │
│  Login (/)  →  Páginas protegidas (/home/*)                 │
│  baseComponents + contextos React + UI por dominio           │
└──────────────────────────┬──────────────────────────────────┘
                           │ Server Actions ('use server')
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    app/actions/*.ts                          │
│  receptions, advances, settlements, trays, pallets, etc.     │
└──────────────────────────┬──────────────────────────────────┘
                           │ getDb()
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              data/db.ts → TypeORM DataSource                 │
│  entities/  +  subscribers/AuditSubscriber                   │
│  services/AuditService                                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ mysql2
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     MySQL (berries_angeles)                  │
└─────────────────────────────────────────────────────────────┘
```

## Patrones arquitectónicos

### Server Actions como backend

Casi toda la lógica de negocio vive en `app/actions/`. Los componentes de UI llaman directamente a estas funciones del servidor en lugar de consumir APIs REST separadas. Solo existen rutas API para autenticación (`/api/auth`) y configuración pública (`/api/config`).

### Componentes servidor vs. cliente

- **Server Components:** páginas como el Dashboard (`app/home/page.tsx`) que obtienen datos directamente en el servidor.
- **Client Components:** login, layout de `/home`, formularios interactivos y grids con filtros. Se marcan con `'use client'`.

### Transacciones como ledger central

Recepciones, anticipos, movimientos de bandejas y asignaciones de pallets se modelan como registros en la tabla `transactions`. Esto permite:

- Trazabilidad unificada de todas las operaciones
- Relaciones padre-hijo entre operaciones (ej. anticipo → liquidación)
- Metadata flexible por tipo sin alterar el esquema

### Auditoría dual

1. **Automática:** `AuditSubscriber` registra cambios en la entidad `Person`.
2. **Manual:** las server actions llaman funciones de auditoría explícitas para login, recepciones, anticipos y usuarios.

## Rutas de la aplicación

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/` | Pública | Página de login |
| `/home` | Protegida | Dashboard |
| `/home/receptions/newRecepcion` | Protegida | Crear recepción |
| `/home/receptions/receptions` | Protegida | Listar/consultar recepciones |
| `/home/productiveManagement/*` | Protegida | Productores, unidades, temporadas |
| `/home/economicManagement/*` | Protegida | Anticipos, liquidaciones, cuentas |
| `/home/storage/*` | Protegida | Almacenes, bandejas, pallets |
| `/home/products/*` | Protegida | Variedades, formatos |
| `/home/users` | Protegida | Gestión de usuarios |
| `/home/audit` | Protegida | Visor de auditoría |

La protección se implementa en `middleware.ts` con NextAuth: cualquier ruta bajo `/home/*` requiere sesión activa.

## Tecnologías clave

| Área | Tecnología |
|------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + Tailwind CSS 3 |
| Base de datos | MySQL via `mysql2` |
| ORM | TypeORM 0.3 (decoradores, subscribers) |
| Autenticación | NextAuth 4 (Credentials, JWT) |
| PWA | Serwist (`@serwist/next`) |
| Mapas | Leaflet + react-leaflet |
| Fechas | moment-timezone (`America/Santiago`) |
| Exportación | xlsx |
| Contraseñas | bcryptjs |

## Alias de importación

El proyecto usa el alias `@/*` configurado en `tsconfig.json`, que apunta a la raíz del proyecto. Ejemplo: `import { getDb } from '@/data/db'`.

## Zona horaria

Toda la aplicación opera en zona horaria de Chile (`America/Santiago`). Las fechas de auditoría y los timestamps de transacciones se formatean con esta zona.
