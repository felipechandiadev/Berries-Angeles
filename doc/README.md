# Documentación — Berries Angeles

App web de gestión agrícola para la industria de berries (frutillas, arándanos, etc.). Permite registrar recepciones de fruta, gestionar almacenamiento en frío, controlar anticipos y liquidaciones a productores, y mantener trazabilidad completa mediante auditoría.

**Stack:** Next.js 15 · React 19 · TypeScript · MySQL · TypeORM · NextAuth · Tailwind CSS · PWA (Serwist)

---

## Índice de módulos

| # | Módulo | Descripción breve |
|---|--------|-------------------|
| 1 | [Arquitectura general](./01-arquitectura.md) | Estructura del proyecto, capas y flujo de datos |
| 2 | [Capa de datos (`data/`)](./02-data.md) | Entidades, base de datos, seed y servicios |
| 3 | [Utilidades (`lib/`)](./03-lib.md) | Configuración, permisos, fechas y exportación Excel |
| 4 | [Autenticación y seguridad](./04-autenticacion.md) | Login, sesiones, middleware y permisos |
| 5 | [Dashboard](./05-dashboard.md) | Panel principal con métricas y actividad reciente |
| 6 | [Recepciones](./06-recepciones.md) | Registro, consulta y gestión de recepciones de fruta |
| 7 | [Gestión productiva](./07-gestion-productiva.md) | Productores, unidades productivas y temporadas |
| 8 | [Gestión económica](./08-gestion-economica.md) | Anticipos, liquidaciones y cuentas bancarias |
| 9 | [Almacenamiento](./09-almacenamiento.md) | Almacenes, bandejas y pallets |
| 10 | [Productos](./10-productos.md) | Variedades y formatos de empaque |
| 11 | [Usuarios y permisos](./11-usuarios-permisos.md) | Gestión de cuentas y control de acceso |
| 12 | [Auditoría](./12-auditoria.md) | Registro de cambios y trazabilidad |
| 13 | [Componentes base (`baseComponents/`)](./13-base-components.md) | Librería de UI interna reutilizable |
| 14 | [PWA y despliegue](./14-pwa-despliegue.md) | Service worker, manifest y configuración Vercel |

---

## Estructura de carpetas del proyecto

```
Berries-Angeles/
├── app/                    # Frontend + Server Actions + API routes
│   ├── actions/            # Lógica de negocio (server actions)
│   ├── api/                # Endpoints REST (auth, config)
│   ├── baseComponents/     # Librería de componentes UI
│   ├── home/               # Páginas protegidas de la aplicación
│   ├── state/              # Contextos React (permisos, alertas)
│   └── ui/                 # Componentes de nivel aplicación
├── data/                   # Capa de persistencia
│   ├── entities/           # Modelos TypeORM
│   ├── seed/               # Scripts y datos de inicialización
│   ├── services/           # Servicios de dominio
│   └── subscribers/        # Eventos automáticos de TypeORM
├── lib/                    # Utilidades compartidas
├── public/                 # Assets estáticos e iconos PWA
├── doc/                    # Esta documentación
└── middleware.ts           # Protección de rutas
```

---

## Concepto central: el modelo de Transacciones

Toda la operación del negocio gira en torno a la entidad `Transaction`. Una transacción puede representar:

- Una **recepción** de fruta de un productor
- Un **anticipo** de pago a un productor
- Un **movimiento de bandejas** (entrada, salida, ajuste, devolución)
- Una **asignación o liberación** de bandejas en un pallet

Cada transacción tiene un `type`, una `direction` (IN/OUT), una `unit` (KG, TRAY, PALLET, CLP, USD) y un campo `metadata` en JSON con los detalles específicos del tipo. Las transacciones se relacionan entre sí mediante `TransactionRelation` (por ejemplo, un anticipo aplicado a una liquidación, o un movimiento de bandeja vinculado a un pack de recepción).

---

## Inicio rápido

```bash
npm install
cp .env.example .env.local   # configurar DB_PASSWORD
npm run seed:test
npm run dev
```

Login post-seed: `admin` / `1234`
