# Bandejas y Pallets

**Rutas:**
- `/home/trays` — Bandejas (menú de primer nivel)
- `/home/dispatch/pallets` — Pallets (bajo Despacho)

**Server actions:** `app/actions/trays.ts`, `app/actions/pallets.ts`, `app/actions/transactions.ts`

## Descripción

Ya no existe el módulo de almacenes físicos. Las bandejas se gestionan como catálogo/stock independiente; los pallets se crean y listan en el flujo de Despacho.

---

## Bandejas

**Server action:** `app/actions/trays.ts`  
**UI:** `app/home/trays/`

Gestiona los tipos de bandejas físicas que circulan entre productores, la planta y clientes. Cada bandeja tiene un peso unitario y un stock que se actualiza con cada movimiento.

### Movimientos de bandejas

Los movimientos se registran como transacciones (en `app/actions/transactions.ts`):

| Función | Tipo de transacción | Efecto en stock |
|---------|---------------------|-----------------|
| `createTrayAdjustment()` | `TRAY_ADJUSTMENT` | Ajuste manual (+/-) |
| `createTrayDelivery()` | `TRAY_DELIVERY_TO_PRODUCER/CLIENT` | Sale de stock |
| `createTrayReception()` | `TRAY_RECEPTION_FROM_PRODUCER/CLIENT` | Entra a stock |

---

## Pallets

**Server action:** `app/actions/pallets.ts`  
**UI:** `app/home/dispatch/pallets/`

Los pallets agrupan bandejas/fruta para despacho. No tienen ubicación de almacén. En el seed se dejan vacíos; se crean desde la UI o al confirmar un despacho.

### Redirects legacy

- `/home/storage/trays` → `/home/trays`
- `/home/storage/pallets` → `/home/dispatch/pallets`
- `/home/storage/storages` → `/home`
