# Gestión productiva

**Rutas:**
- `/home/productiveManagement/producers` — Productores
- `/home/productiveManagement/units` — Unidades productivas
- `/home/productiveManagement/seasons` — Temporadas

## Descripción

Módulo que administra los actores y contexto de la producción agrícola: quién produce (productores), dónde produce (unidades productivas) y en qué período (temporadas).

---

## Productores

**Server action:** `app/actions/producers.ts`
**UI:** `app/home/productiveManagement/producers/`

### Qué hace

Gestiona el registro de productores de berries. Un productor es una persona física asociada a una unidad productiva. Es el actor central en recepciones, anticipos y liquidaciones.

### Datos del productor

| Campo | Descripción |
|-------|-------------|
| `name` | Nombre del productor |
| `dni` | RUT/documento de identidad |
| `phone` | Teléfono de contacto |
| `mail` | Email |
| `productiveUnitId` | Unidad productiva asociada |
| `personId` | Registro Person vinculado (datos bancarios) |

### Operaciones

| Función | Descripción |
|---------|-------------|
| `getProducersGridData()` | Lista paginada con filtros y búsqueda |
| `getProducersExportData()` | Datos para exportación Excel |
| `getProducersSimpleList()` | Lista simple para selectores |
| `createProducer()` | Crea Person + Producer en transacción |
| `updateProducer()` | Actualiza datos del productor y persona |
| `deleteProducer()` | Soft delete del productor |

### UI

- Grid con columnas: nombre, RUT, teléfono, unidad productiva
- Botones: crear, editar, eliminar
- Exportación a Excel

---

## Unidades productivas

**Server action:** `app/actions/productiveUnits.ts`
**UI:** `app/home/productiveManagement/units/`

### Qué hace

Administra los predios, fundos o campos donde se produce la fruta. Cada productor está asociado a una unidad productiva.

### Datos de la unidad productiva

| Campo | Descripción |
|-------|-------------|
| `name` | Nombre del predio/fundo |
| `location` | Ubicación textual |
| `coordinates` | Latitud/longitud (mapa con Leaflet) |
| `contactPhone` | Teléfono del fundo |
| `contactEmail` | Email de contacto |
| `area` | Superficie en hectáreas |
| `notes` | Notas adicionales |

### Operaciones

| Función | Descripción |
|---------|-------------|
| `getProductiveUnitsGridData()` | Grid paginado con filtros |
| `getProductiveUnitsExportData()` | Exportación Excel |
| `getProductiveUnitsSimpleList()` | Lista para selectores |
| `createProductiveUnit()` | Crear unidad |
| `updateProductiveUnit()` | Actualizar datos |
| `deleteProductiveUnit()` | Soft delete |

### UI

- Grid con datos del predio
- `LocationPicker` (Leaflet) para seleccionar coordenadas en mapa
- CRUD completo con diálogos de confirmación

---

## Temporadas

**Server action:** `app/actions/seasons.ts`
**UI:** `app/home/productiveManagement/seasons/`

### Qué hace

Gestiona las temporadas de cosecha. Define el período operativo del negocio. Las transacciones (recepciones, anticipos) se asocian a la temporada activa.

### Datos de la temporada

| Campo | Descripción |
|-------|-------------|
| `name` | Nombre (ej. "2025-2026") |
| `startDate` | Fecha de inicio |
| `endDate` | Fecha de fin |
| `active` | Si es la temporada vigente |

### Reglas de negocio

- Solo puede haber **una temporada activa** a la vez
- Al activar una temporada, las demás se desactivan automáticamente
- Las recepciones y anticipos usan la temporada activa por defecto
- No se puede eliminar la temporada activa

### Operaciones

| Función | Descripción |
|---------|-------------|
| `getSeasons()` | Lista con filtros |
| `getActiveSeason()` | Obtiene la temporada vigente |
| `createSeason()` | Crear temporada (puede activarla) |
| `updateSeason()` | Modificar datos o cambiar estado activo |
| `deleteSeason()` | Soft delete (no permite si está activa) |

### UI

- Vista de cards con estado activo/inactivo
- Diálogos para crear, editar y eliminar
- Indicador visual de temporada activa
