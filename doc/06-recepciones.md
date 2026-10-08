# Recepciones

**Rutas:**
- `/home/receptions/newRecepcion` — Crear nueva recepción
- `/home/receptions/receptions` — Listar y consultar recepciones

**Server action:** `app/actions/receptions.ts` (~2700 líneas, módulo más complejo del sistema)

## Descripción

El módulo de recepciones es el corazón operativo de Berries Angeles. Gestiona el proceso completo de recepción de fruta berry desde productores: registro de packs, cálculo de pesos y pagos, asignación a pallets, devolución de bandejas y trazabilidad.

## Flujo de nueva recepción

```
1. Seleccionar productor y temporada
2. Ingresar datos de guía (número, fecha, tipo de cambio)
3. Agregar packs (variedad, formato, bandeja, pesos, impurezas)
4. Asignar packs a pallets disponibles
5. Registrar devolución de bandejas al productor (opcional)
6. Procesar recepción → crea Transaction + ReceptionPacks + movimientos
```

### Datos de cada pack

| Campo | Descripción |
|-------|-------------|
| `packNumber` | Número secuencial del pack |
| `varietyId` | Variedad de berry (define precio) |
| `formatId` | Formato de empaque |
| `trayId` | Tipo de bandeja usada |
| `traysQuantity` | Cantidad de bandejas en el pack |
| `grossWeight` | Peso bruto en kg |
| `impurityPercent` | Porcentaje de impurezas |
| `netWeight` | Peso neto calculado (bruto − impurezas − peso bandejas) |
| `price` / `currency` | Precio unitario (CLP o USD según variedad) |
| `totalToPay` | Monto total a pagar por el pack |
| `palletAssignments` | Pallets donde se almacena el pack |

### Cálculos automáticos

- **Peso neto:** `grossWeight - (grossWeight × impurityPercent/100) - traysTotalWeight`
- **Total a pagar:** `netWeight × price` (en CLP o USD según variedad)
- **Totales de recepción:** suma de packs en peso, bandejas y montos CLP/USD
- **Conversión:** total CLP = total USD × tipo de cambio + total CLP directo

## Consulta de recepciones

### Grid de recepciones (`ReceptionsGrid`)

Lista paginada con filtros por productor, temporada, rango de fechas y búsqueda. Columnas principales: fecha, productor, guía, variedades, packs, peso neto, montos.

Funciones de exportación a Excel disponibles.

### Detalle de recepción (`ReceptionDetail`)

Vista completa de una recepción individual con:

- **Header:** datos generales (productor, guía, fecha, operador, tipo de cambio)
- **Packs:** tabla con todos los packs, pesos, precios y pallets asignados
- **Totales:** resumen de pesos, bandejas y montos
- **Devoluciones de bandejas:** bandejas devueltas al productor
- **Movimientos relacionados:** transacciones derivadas (asignaciones pallet, movimientos bandeja)
- **Historial:** cambios registrados en auditoría

### Operaciones sobre recepciones existentes

| Operación | Función | Descripción |
|-----------|---------|-------------|
| Eliminar recepción | `deleteReception()` | Elimina transacción, packs, relaciones y revierte movimientos |
| Eliminar pack | `removeReceptionPack()` | Quita un pack, libera pallets y revierte bandejas |
| Cambiar fecha | `updateReceptionDate()` | Modifica fecha de la recepción |
| Cambiar tipo de cambio | `updateReceptionExchangeRate()` | Actualiza USD/CLP y recalcula montos |
| Editar impurezas | `updatePackImpurity()` | Modifica % impurezas y recalcula peso neto y pago |
| Editar precio | `updatePackPrice()` | Cambia precio del pack y recalcula total |

## Entidades involucradas

- `Transaction` (tipo `RECEPTION`) — registro principal
- `ReceptionPack` — cada pack de la recepción
- `TransactionRelation` — vínculos con movimientos de bandejas y pallets
- `Pallet` — asignación de bandejas a pallets
- `Tray` — actualización de stock por devoluciones
- `Audit` — registro de cada operación

## Documentación técnica adicional

El módulo incluye guías de implementación en su carpeta:

| Archivo | Contenido |
|---------|-----------|
| `IMPLEMENTATION_GUIDE.md` | Flujo completo de registro |
| `TESTING_IMPLEMENTATION.md` | Notas de testing |
| `RECEPTION_DETAIL_IMPLEMENTATION_GUIDE.md` | UI de detalle |
| `PACK_DELETION_PROCESS.md` | Proceso de eliminación de packs |
| `RECEPTION_DELETION_IMPLICATIONS.md` | Efectos de eliminar recepción |
| `RECEPTION_TRANSACTION.md` | Modelo de transacción |

## Componentes UI principales

**Nueva recepción:**
- `DetailsContainer` — contenedor principal del formulario
- `DetailReceptionCard` — card por cada pack
- `TransactionData` — datos generales de la transacción
- `TrayDevolutionContainer` — devolución de bandejas
- `PalletPicker` — selector de pallets
- `ProcessedReceptionDialog` — confirmación post-proceso

**Consulta:**
- `ReceptionsGrid` — grid principal
- `ReceptionDetail/` — vista de detalle completa
- `DeleteReceptionButton` — eliminación con confirmación
