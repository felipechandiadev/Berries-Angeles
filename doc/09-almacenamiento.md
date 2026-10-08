# Almacenamiento

**Rutas:**
- `/home/storage/storages` — Almacenes
- `/home/storage/trays` — Bandejas
- `/home/storage/pallets` — Pallets

**Server actions:** `app/actions/storages.ts`, `app/actions/trays.ts`, `app/actions/pallets.ts`, `app/actions/transactions.ts`

## Descripción

Módulo que gestiona la infraestructura física de almacenamiento: almacenes (cámaras, túneles), tipos de bandejas y pallets donde se ubica la fruta recibida.

---

## Almacenes

**Server action:** `app/actions/storages.ts`
**UI:** `app/home/storage/storages/`

### Qué hace

Administra los espacios físicos de almacenamiento donde se ubican pallets con fruta.

### Tipos de almacén

| Tipo | Descripción |
|------|-------------|
| `COLD_ROOM` | Cámara fría para fruta fresca |
| `IQF_TUNNEL` | Túnel de congelación IQF |
| `DRY_WAREHOUSE` | Bodega seca |
| `FREEZER` | Congelador |

### Datos

| Campo | Descripción |
|-------|-------------|
| `name` | Nombre del almacén |
| `type` | Tipo de almacenamiento |
| `capacityPallets` | Capacidad máxima en pallets |
| `location` | Ubicación física |
| `active` | Si está operativo |

### Operaciones

CRUD completo: `getStorages()`, `getStorageById()`, `createStorage()`, `updateStorage()`, `deleteStorage()`.

---

## Bandejas

**Server action:** `app/actions/trays.ts`
**UI:** `app/home/storage/trays/`

### Qué hace

Gestiona los tipos de bandejas físicas que circulan entre productores, la planta y clientes. Cada bandeja tiene un peso unitario y un stock que se actualiza con cada movimiento.

### Datos

| Campo | Descripción |
|-------|-------------|
| `name` | Nombre/identificador de la bandeja |
| `weight` | Peso unitario en kg |
| `stock` | Stock actual disponible |
| `description` | Descripción adicional |

### Movimientos de bandejas

Los movimientos se registran como transacciones (en `app/actions/transactions.ts`):

| Función | Tipo de transacción | Efecto en stock |
|---------|---------------------|-----------------|
| `createTrayAdjustment()` | `TRAY_ADJUSTMENT` | Ajuste manual (+/-) |
| `createTrayDelivery()` | `TRAY_DELIVERY_TO_PRODUCER/CLIENT` | Sale de stock |
| `createTrayReception()` | `TRAY_RECEPTION_FROM_PRODUCER/CLIENT` | Entra a stock |

Cada movimiento actualiza el `stock` de la bandeja y registra `stockBefore`/`stockAfter` en metadata.

### Operaciones CRUD

`getTrays()`, `getTrayById()`, `createTray()`, `updateTray()`, `deleteTray()`, `getTraysSimpleList()`.

---

## Pallets

**Server action:** `app/actions/pallets.ts`
**UI:** `app/home/storage/pallets/`

### Qué hace

Administra pallets físicos dentro de almacenes. Los pallets reciben bandejas de packs de recepción y tienen capacidad, peso y estado.

### Estados del pallet

| Estado | Descripción |
|--------|-------------|
| `AVAILABLE` | Vacío o parcial, disponible para asignar |
| `CLOSED` | Cerrado, no acepta más bandejas |
| `FULL` | A capacidad máxima |
| `DISPATCHED` | Despachado/salido del almacén |

### Datos

| Campo | Descripción |
|-------|-------------|
| `storageId` | Almacén donde está ubicado |
| `trayId` | Tipo de bandeja del pallet |
| `traysQuantity` | Bandejas actualmente asignadas |
| `capacity` | Capacidad máxima en bandejas |
| `weight` | Peso total actual |
| `dispatchWeight` | Peso al despachar |
| `metadata` | Asignaciones de bandejas (JSON) |
| `status` | Estado actual |

### Asignación de bandejas

Cuando se procesa una recepción, los packs se asignan a pallets. Esto crea:

1. Transacción `PALLET_TRAY_ASSIGNMENT` — registra la asignación
2. Actualización del `metadata` del pallet con `{ receptionPackId, trayId, quantity }`
3. Incremento de `traysQuantity` y `weight` del pallet
4. Cambio de estado si alcanza capacidad (`FULL`)

La liberación (`PALLET_TRAY_RELEASE`) revierte estos cambios.

### Operaciones

| Función | Descripción |
|---------|-------------|
| `getPallets()` | Lista con filtros |
| `getPalletsGridData()` | Grid paginado |
| `getPalletsExportData()` | Exportación Excel |
| `getAvailablePalletSummaries()` | Pallets disponibles para recepción |
| `getPalletById()` | Detalle de un pallet |
| `createPallet()` | Crear pallet en almacén |
| `updatePallet()` | Modificar datos/estado |
| `deletePallet()` | Soft delete (solo si no tiene asignaciones) |
| `getPalletsSimpleList()` | Lista para selectores |

### UI

- Grid con filtros por almacén, estado, tipo de bandeja
- CRUD con diálogos
- Exportación Excel
- Vista de capacidad y ocupación

## Relación con recepciones

```
Recepción → Pack → Asignación a Pallet → PALLET_TRAY_ASSIGNMENT
                                         → Actualiza pallet.traysQuantity
                                         → Actualiza pallet.weight
                                         → Actualiza pallet.status
```

La devolución de bandejas en una recepción genera transacciones `TRAY_DELIVERY_TO_PRODUCER` que reducen el stock de bandejas.
