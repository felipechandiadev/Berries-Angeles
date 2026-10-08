# Productos

**Rutas:**
- `/home/products/varieties` — Variedades
- `/home/products/formats` — Formatos

**Server actions:** `app/actions/varieties.ts`, `app/actions/formats.ts`

## Descripción

Módulo de catálogo que define los productos agrícolas: las variedades de berry (con su precio de compra) y los formatos de empaque en que se recibe la fruta.

---

## Variedades

**UI:** `app/home/products/varieties/`

### Qué hace

Administra las variedades de berries que la planta compra a los productores. Cada variedad tiene un precio de compra en CLP o USD que se usa automáticamente al registrar packs en recepciones.

### Datos

| Campo | Descripción |
|-------|-------------|
| `name` | Nombre de la variedad (ej. "Frutilla Camarosa") |
| `description` | Descripción adicional |
| `price` | Precio de compra por kg |
| `currency` | `CLP` o `USD` |
| `active` | Si está disponible para recepciones |

### Operaciones

| Función | Descripción |
|---------|-------------|
| `getVarieties()` | Lista con filtros |
| `getVarietyById()` | Detalle |
| `createVariety()` | Crear variedad |
| `updateVariety()` | Modificar (precio, nombre, estado) |
| `deleteVariety()` | Soft delete |
| `getVarietiesSimpleList()` | Lista para selectores |
| `getVarietiesWithPriceAndCurrency()` | Lista con precio (para recepciones) |

### Uso en recepciones

Al seleccionar una variedad en un pack de recepción:
1. Se carga automáticamente el precio y moneda
2. El cálculo de `totalToPay` usa `netWeight × price`
3. Si la moneda es USD, el monto se suma al total USD de la recepción

### UI

- Vista de cards con precio y moneda
- CRUD con diálogos de crear, editar y eliminar
- Indicador de variedad activa/inactiva

---

## Formatos

**UI:** `app/home/products/formats/`

### Qué hace

Administra los formatos de empaque en que se recibe la fruta (clamshells, bandejas, bins, etc.).

### Datos

| Campo | Descripción |
|-------|-------------|
| `name` | Nombre del formato (ej. "Clamshell 250g") |
| `description` | Descripción |
| `weight` | Peso del empaque vacío (si aplica) |
| `active` | Si está disponible |

### Operaciones

| Función | Descripción |
|---------|-------------|
| `getFormats()` | Lista con filtros |
| `getFormatById()` | Detalle |
| `createFormat()` | Crear formato |
| `updateFormat()` | Modificar |
| `deleteFormat()` | Soft delete |
| `getFormatsSimpleList()` | Lista para selectores |

### Uso en recepciones

Al seleccionar un formato en un pack, se registra como referencia en el `ReceptionPack`. No afecta cálculos de peso ni precio directamente (el peso de bandeja viene del tipo de bandeja, no del formato).

### UI

- Vista de cards
- CRUD con diálogos
- Indicador activo/inactivo
