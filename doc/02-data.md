# Capa de datos (`data/`)

La carpeta `data/` contiene toda la lógica de persistencia: conexión a base de datos, entidades TypeORM, seed de datos, servicios y subscribers de eventos.

## `data/db.ts` — Conexión a base de datos

Singleton de TypeORM `DataSource` con lógica de reintento. Expone la función `getDb()` que usan todas las server actions para obtener una conexión activa a MySQL.

Configuración leída desde variables de entorno (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

## Entidades (`data/entities/`)

### Person
Registro base de una persona física. Contiene DNI, teléfono, email y un campo JSON `bankAccounts` con las cuentas bancarias de la persona. Es la entidad padre de usuarios, productores y clientes.

### User
Cuenta de acceso al sistema. Vinculada 1:1 con `Person`. Tiene username, contraseña hasheada (bcrypt) y rol (`ADMIN` o `OPERATOR`). Los usuarios ADMIN reciben automáticamente todos los permisos.

### Permission
Permisos granulares asignados a usuarios. Actualmente define habilidades sobre gestión de usuarios: `USERS_VIEW`, `USERS_CREATE`, `USERS_UPDATE`, `USERS_DELETE`.

### ProductiveUnit
Unidad productiva (fundo, campo, predio). Representa la ubicación geográfica donde se produce la fruta. Puede tener coordenadas GPS y datos de contacto.

### Producer
Productor de berries. Vinculado a una `Person` (datos personales y bancarios) y a una `ProductiveUnit` (ubicación de producción). Es el actor principal en recepciones, anticipos y liquidaciones.

### Customer
Cliente o comprador de fruta. También vinculado a `Person`. Se usa en movimientos de bandejas hacia/desde clientes.

### Season
Temporada de cosecha. Tiene nombre, fechas de inicio/fin y un flag `active` que indica la temporada vigente. Solo puede haber una temporada activa a la vez. Las transacciones se asocian a la temporada activa.

### Variety
Variedad de berry (ej. Frutilla Camarosa, Arándano Duke). Define precio de compra en CLP o USD. Se selecciona al registrar packs en una recepción.

### Format
Formato de empaque (ej. Clamshell 250g, Bandeja 500g). Define el tipo de contenedor en el que se recibe la fruta.

### Storage
Almacén físico. Tipos: `COLD_ROOM` (cámara fría), `IQF_TUNNEL` (túnel IQF), `DRY_WAREHOUSE` (bodega seca), `FREEZER` (congelador). Tiene capacidad en pallets y ubicación.

### Tray
Tipo de bandeja física. Define peso unitario y stock disponible. Las bandejas circulan entre productores, la planta y clientes; su stock se actualiza con cada movimiento.

### Pallet
Pallet físico dentro de un almacén. Estados: `AVAILABLE`, `CLOSED`, `FULL`, `DISPATCHED`. Contiene asignaciones de bandejas (`metadata` JSON) vinculadas a packs de recepción. Capacidad máxima y peso registrados.

### Transaction
**Entidad central del sistema.** Registra toda operación de negocio.

Tipos de transacción:
| Tipo | Descripción |
|------|-------------|
| `RECEPTION` | Recepción de fruta de un productor |
| `ADVANCE` | Anticipo de pago a un productor |
| `TRAY_ADJUSTMENT` | Ajuste manual de stock de bandejas |
| `TRAY_IN_FROM_PRODUCER` | Entrada de bandejas desde productor |
| `TRAY_OUT_TO_PRODUCER` | Salida de bandejas hacia productor |
| `TRAY_OUT_TO_CLIENT` | Salida de bandejas hacia cliente |
| `TRAY_IN_FROM_CLIENT` | Entrada de bandejas desde cliente |
| `TRAY_RECEPTION_FROM_PRODUCER` | Recepción de bandejas del productor |
| `TRAY_RECEPTION_FROM_CLIENT` | Recepción de bandejas del cliente |
| `TRAY_DELIVERY_TO_PRODUCER` | Entrega de bandejas al productor |
| `TRAY_DELIVERY_TO_CLIENT` | Entrega de bandejas al cliente |
| `PALLET_TRAY_ASSIGNMENT` | Asignación de bandejas a un pallet |
| `PALLET_TRAY_RELEASE` | Liberación de bandejas de un pallet |

Cada transacción tiene `direction` (IN/OUT), `unit` (KG, TRAY, PALLET, CLP, USD), `quantity`, `metadata` (JSON con detalles específicos) y relaciones con Season, Producer, Customer y User.

### TransactionRelation
Vincula transacciones entre sí. Tipos de relación incluyen anticipos aplicados a liquidaciones, movimientos derivados de recepciones, etc.

### ReceptionPack
Pack individual dentro de una recepción. Contiene variedad, formato, bandeja, pesos (bruto, neto, impurezas), precio y asignaciones a pallets.

### AdminBankAccount
Cuentas bancarias de la empresa (administrador). Se usan como origen de los pagos de anticipos.

### Audit
Registro de auditoría. Guarda acción (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`), entidad afectada, valores anteriores y nuevos (JSON), usuario responsable y timestamp.

## Servicios (`data/services/`)

### AuditService
Servicio centralizado para crear registros de auditoría. Usado por subscribers y server actions.

## Subscribers (`data/subscribers/`)

### AuditSubscriber
Subscriber de TypeORM que escucha eventos `afterInsert`, `afterUpdate` y `afterRemove` sobre la entidad `Person`. Crea automáticamente registros de auditoría con los valores anteriores y nuevos.

## Seed (`data/seed/`)

Sistema de inicialización de base de datos para desarrollo y pruebas.

| Archivo | Función |
|---------|---------|
| `seed.ts` | Orquestador principal del seed |
| `sql/create-tables.sql` | DDL para crear todas las tablas |
| `sql/drop-all-tables.sql` | Elimina todas las tablas |
| `sql/seed-data.sql` | Datos SQL adicionales |
| `dataToSeed/*.json` | Fixtures JSON por entidad |

**Comando:** `npm run seed:test` → ejecuta `run-seed.js` → `data/seed/seed.ts`

Crea el esquema completo y carga datos de prueba: usuarios, productores, variedades, formatos, almacenes, bandejas, pallets, recepciones, anticipos y registros de auditoría.

**Login post-seed:** `admin` / `1234`
