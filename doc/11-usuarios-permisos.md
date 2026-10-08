# Usuarios y permisos

**Ruta:** `/home/users`
**Server actions:** `app/actions/users.ts`, `app/actions/persons.ts`, `app/actions/permissions.ts`
**UI:** `app/home/users/`

## Descripción

Módulo de administración de cuentas de usuario del sistema. Gestiona quién puede acceder, con qué rol y qué permisos granulares tiene cada operador.

## Modelo de datos

```
Person (datos personales)
  └── User (cuenta de acceso)
        └── Permission[] (habilidades granulares)
```

- Cada `User` está vinculado 1:1 a un `Person`
- Los permisos se asignan individualmente por usuario
- Los usuarios `ADMIN` reciben todos los permisos automáticamente

## Datos del usuario

| Campo | Descripción |
|-------|-------------|
| `username` | Nombre de usuario para login |
| `password` | Contraseña (hasheada con bcrypt) |
| `role` | `ADMIN` o `OPERATOR` |
| `personId` | Vínculo a Person (nombre, DNI, contacto) |

## Operaciones de usuarios

| Función | Descripción |
|---------|-------------|
| `createUser()` | Crea Person + User con contraseña hasheada |
| `getUsers()` | Lista con búsqueda por nombre/username |
| `getUserById()` | Detalle con permisos |
| `updateUser()` | Modificar datos y rol |
| `deleteUser()` | Soft delete con auditoría |

## Operaciones de personas

| Función | Descripción |
|---------|-------------|
| `createPerson()` | Crear registro de persona |
| `getPersons()` | Listar personas |
| `getPersonById()` | Detalle |
| `updatePerson()` | Modificar (con auditoría automática via subscriber) |
| `deletePerson()` | Soft delete |

## Operaciones de permisos

| Función | Descripción |
|---------|-------------|
| `getUserPermissions()` | Obtiene habilidades del usuario |
| `updateUserPermissions()` | Asigna/revoca permisos granulares |

### Permisos disponibles

| Ability | Descripción |
|---------|-------------|
| `USERS_VIEW` | Ver lista y detalles de usuarios |
| `USERS_CREATE` | Crear nuevas cuentas |
| `USERS_UPDATE` | Editar datos y permisos |
| `USERS_DELETE` | Eliminar cuentas |

## Control de acceso en UI

El módulo de usuarios usa el componente `Can` para mostrar u ocultar acciones según permisos:

```tsx
<Can ability="USERS_CREATE">
  <CreateUserDialog />
</Can>
```

Los botones de crear, editar, eliminar y gestionar permisos solo aparecen si el usuario tiene la habilidad correspondiente.

## Componentes UI

| Componente | Función |
|------------|---------|
| `userList` | Lista/grid de usuarios |
| `userCard` | Card individual con acciones |
| `CreateUserDialog` | Formulario de creación |
| `UpdateUserDialog` | Edición de datos |
| `UpdateUserPasswordDialog` | Cambio de contraseña |
| `DeleteUserDialog` | Confirmación de eliminación |
| `ViewUserPermissionsDialog` | Ver permisos actuales |
| `ManageUserPermissionsDialog` | Asignar/revocar permisos |
| `UserProfileDropdown` | Menú de perfil en TopBar |

## Auditoría

- Creación, edición y eliminación de usuarios generan registros de auditoría
- Cambios en `Person` se auditan automáticamente via `AuditSubscriber`
- Cambios de permisos se registran explícitamente
