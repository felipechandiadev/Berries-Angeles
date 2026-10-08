# Gestión económica

**Rutas:**
- `/home/economicManagement/advances` — Anticipos
- `/home/economicManagement/settlements` — Liquidaciones
- `/home/economicManagement/bankAccounts` — Cuentas bancarias

## Descripción

Módulo que administra el flujo de dinero entre la empresa y los productores: anticipos de pago, liquidaciones de recepciones pendientes y las cuentas bancarias de la empresa.

---

## Anticipos

**Server action:** `app/actions/advances.ts`
**UI:** `app/home/economicManagement/advances/`

### Qué hace

Permite registrar pagos anticipados a productores antes de liquidar sus recepciones. Un anticipo es una transacción de tipo `ADVANCE` con dirección `OUT` y unidad `CLP`.

### Datos del anticipo

| Campo | Descripción |
|-------|-------------|
| `producerId` | Productor beneficiario |
| `seasonId` | Temporada (usa la activa por defecto) |
| `amount` | Monto en CLP |
| `paymentMethod` | `CASH`, `TRANSFER` o `CHECK` |
| `paymentDetails` | Referencia, cuenta origen, cuenta destino del productor |
| `notes` | Notas adicionales |
| `userId` | Operador que registra |

### Estados del anticipo

| Estado | Descripción |
|--------|-------------|
| `ACTIVE` | Disponible para aplicar a liquidaciones |
| `APPLIED` | Totalmente aplicado a una o más liquidaciones |
| `CANCELLED` | Anulado |

### Operaciones

| Función | Descripción |
|---------|-------------|
| `createAdvance()` | Registra anticipo con auditoría |
| `listAdvances()` | Lista con filtros (productor, temporada, método, estado, fechas) |
| `getAdvanceDetail()` | Detalle con historial de aplicaciones |
| `deleteAdvance()` | Anula anticipo (solo si no tiene aplicaciones) |
| `applyAdvance()` | Aplica monto a una liquidación |
| `getProducerBankAccounts()` | Cuentas bancarias del productor |

### Flujo de aplicación

```
Anticipo ACTIVE → Liquidación de recepciones → applyAdvance()
  → Crea TransactionRelation (anticipo ↔ liquidación)
  → Actualiza appliedAmount y availableAmount
  → Si availableAmount = 0 → status = APPLIED
```

### UI

- Grid con filtros por productor, temporada, método de pago y estado
- Botón crear anticipo con formulario completo
- Detalle con historial de aplicaciones
- Impresión de comprobante
- Eliminación con confirmación

---

## Liquidaciones

**Server action:** `app/actions/settlements.ts`
**UI:** `app/home/economicManagement/settlements/`

### Qué hace

Pantalla de consulta para visualizar recepciones y anticipos pendientes de liquidación. Permite al operador ver qué se le debe a cada productor.

### Secciones

#### Recepciones pendientes (`listPendingReceptions`)

Muestra recepciones que aún no han sido liquidadas:

| Columna | Descripción |
|---------|-------------|
| Fecha | Fecha de la recepción |
| Guía | Número de guía de despacho |
| Productor | Nombre del productor |
| Unidad productiva | Fundo de origen |
| Variedades | Variedades en la recepción |
| Packs | Cantidad de packs |
| Peso neto | Total kg netos |
| Monto CLP | Total a pagar en pesos |
| Monto USD | Total en dólares |
| Tipo de cambio | USD/CLP de la recepción |

Filtros: productor, temporada, paginación.

#### Anticipos pendientes (`listPendingAdvances`)

Muestra anticipos con saldo disponible para aplicar:

| Columna | Descripción |
|---------|-------------|
| Fecha | Fecha del anticipo |
| Temporada | Temporada asociada |
| Operador | Quien registró |
| Método de pago | Efectivo, transferencia, cheque |
| Monto | Monto original |
| Aplicado | Monto ya aplicado |
| Disponible | Saldo restante |

Incluye totales agregados de monto, aplicado y disponible.

### UI

- `PendingReceptionsSection` — tabla de recepciones con filtros
- `PendingAdvancesSection` — tabla de anticipos con filtros
- `SettlementSummary` — resumen de montos
- `NewSettlementContent` — flujo de nueva liquidación

---

## Cuentas bancarias

**Server action:** `app/actions/adminBankAccounts.ts`
**UI:** `app/home/economicManagement/bankAccounts/`

### Qué hace

Administra las cuentas bancarias de la empresa (administrador). Estas cuentas se usan como origen en los pagos de anticipos por transferencia.

### Datos de la cuenta

| Campo | Descripción |
|-------|-------------|
| `bankName` | Nombre del banco |
| `accountNumber` | Número de cuenta |
| `accountType` | Tipo (corriente, vista, etc.) |
| `holderName` | Titular de la cuenta |
| `active` | Si está disponible para pagos |

### Operaciones

| Función | Descripción |
|---------|-------------|
| `getAdminBankAccounts()` | Lista con filtros |
| `getActiveAdminBankAccounts()` | Solo cuentas activas (para selectores) |
| `createAdminBankAccount()` | Crear cuenta |
| `updateAdminBankAccount()` | Modificar datos |
| `deleteAdminBankAccount()` | Soft delete |

### UI

- Vista de cards por cuenta bancaria
- CRUD con diálogos
- Indicador de cuenta activa/inactiva
