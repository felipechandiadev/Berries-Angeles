# Utilidades compartidas (`lib/`)

Carpeta con funciones y configuraciones transversales usadas por múltiples módulos de la aplicación.

## `lib/appConfig.ts`

Centraliza la lectura de variables de entorno y expone configuración segura.

- **Variables de BD:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- **App:** `NEXT_PUBLIC_APP_NAME`
- Expone una función para obtener configuración pública (sin credenciales) que consume el endpoint `/api/config` y el diálogo de configuración de BD en la página de login.

## `lib/permissions.ts`

Define el sistema de permisos granulares de la aplicación.

**Habilidades disponibles:**

| Ability | Label | Descripción |
|---------|-------|-------------|
| `USERS_VIEW` | Ver usuarios | Visualizar lista y detalles de usuarios |
| `USERS_CREATE` | Crear usuarios | Crear nuevas cuentas |
| `USERS_UPDATE` | Editar usuarios | Modificar datos o permisos |
| `USERS_DELETE` | Eliminar usuarios | Desactivar o eliminar cuentas |

Exporta:
- `ABILITY_VALUES` — lista de habilidades válidas
- `PERMISSION_DEFINITIONS` — definiciones con labels y descripciones
- `validAbilities` — Set para validación
- `getPermissionDefinition()` — buscar definición por ability

Los usuarios con rol `ADMIN` reciben automáticamente todas las habilidades sin necesidad de registros en la tabla `permissions`.

## `lib/dateTimeUtils.ts`

Utilidades de fecha y hora con zona horaria de Chile.

- Zona horaria fija: `America/Santiago`
- Funciones de formateo para auditoría y visualización en UI
- Usado por server actions y componentes que muestran timestamps

## `lib/excelExport.ts`

Generación de archivos Excel (.xlsx) para exportación de datos desde los grids de la aplicación.

Soporta exportación de:
- Auditoría
- Productores
- Pallets
- Recepciones
- Unidades productivas

Usa la librería `xlsx` para generar los archivos en el cliente a partir de los datos retornados por las server actions de exportación.
