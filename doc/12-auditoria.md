# Auditoría

**Ruta:** `/home/audit`
**Server actions:** `app/actions/audits.ts`, `app/actions/audit.advances.ts`, `app/actions/audit.persons.ts`, `app/actions/loginAudit.ts`
**Servicio:** `data/services/AuditService.ts`
**Subscriber:** `data/subscribers/AuditSubscriber.ts`

## Descripción

Módulo de trazabilidad que registra todas las operaciones relevantes del sistema. Permite consultar quién hizo qué, cuándo y qué valores cambiaron.

## Modelo de auditoría

### Entidad Audit

| Campo | Descripción |
|-------|-------------|
| `action` | Tipo de acción: `CREATE`, `UPDATE`, `DELETE`, `LOGIN` |
| `entityName` | Nombre de la entidad afectada (ej. "User", "Person", "Reception") |
| `entityId` | ID del registro afectado |
| `description` | Descripción legible de la acción |
| `oldValues` | Valores anteriores (JSON) |
| `newValues` | Valores nuevos (JSON) |
| `userId` | Usuario que realizó la acción |
| `userName` | Nombre del usuario |
| `ipAddress` | IP del cliente |
| `userAgent` | Navegador/dispositivo |
| `createdAt` | Timestamp (zona Chile) |

## Mecanismos de registro

### 1. Automático — AuditSubscriber

Escucha eventos de TypeORM sobre la entidad `Person`:
- `afterInsert` → registra CREATE
- `afterUpdate` → registra UPDATE con old/new values
- `afterRemove` → registra DELETE

### 2. Manual — Server actions

Funciones dedicadas llamadas explícitamente:

| Función | Módulo | Qué registra |
|---------|--------|-------------|
| `logLoginAudit()` | Login | Intentos de login (éxito/fallo) |
| `logAdvanceAudit()` | Anticipos | Creación, aplicación, eliminación |
| `logPersonAudit()` | Personas | Cambios manuales en personas |
| Auditoría inline | Recepciones | Procesamiento, edición, eliminación |
| Auditoría inline | Usuarios | CRUD de cuentas |

### 3. Servicio centralizado — AuditService

`data/services/AuditService.ts` provee métodos reutilizables para crear registros de auditoría con formato consistente.

## Consulta de auditoría

### Grid de auditoría (`AuditDataGrid`)

| Función | Descripción |
|---------|-------------|
| `getAuditGridData()` | Lista paginada con filtros |
| `getAuditExportData()` | Exportación Excel |
| `getAuditStats()` | Estadísticas (totales por acción, entidad) |

### Filtros disponibles

- Rango de fechas
- Tipo de acción (CREATE, UPDATE, DELETE, LOGIN)
- Entidad afectada
- Usuario responsable
- Búsqueda por texto en descripción

### UI

- `AuditDataGrid` — tabla principal con paginación
- `AuditMoreButton` — ver detalle de old/new values
- Exportación a Excel
- Filtros en toolbar del grid

## Tipos de acción

```typescript
enum AuditActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
}
```

## Zona horaria

Todos los timestamps de auditoría se almacenan y muestran en zona horaria de Chile (`America/Santiago`), usando `lib/dateTimeUtils.ts`.

## Integración con Dashboard

Las últimas 8 entradas de auditoría se muestran en el Dashboard como "Actividad reciente", dando visibilidad inmediata de las operaciones del sistema.
