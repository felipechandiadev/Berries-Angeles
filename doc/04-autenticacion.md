# Autenticación y seguridad

## Flujo de autenticación

```
Usuario → / (login) → NextAuth Credentials → User entity → JWT session
                                                          ↓
                                              middleware.ts protege /home/*
```

### Página de login (`app/page.tsx`)

Componente cliente que presenta el formulario de login. Usa `signIn('credentials')` de NextAuth con username y password. Tras login exitoso redirige a `/home`.

También incluye un diálogo de configuración de base de datos (`UpdateDataBaseDialog`) que consulta `/api/config` para mostrar el estado de la conexión.

### NextAuth (`app/api/auth/`)

| Archivo | Función |
|---------|---------|
| `authOptions.ts` | Configuración del provider Credentials, callbacks JWT/session, validación con bcrypt |
| `[...nextauth]/route.ts` | Handler de rutas NextAuth |

**Provider:** Credentials (username + password contra tabla `users`).

**Sesión:** JWT (no se usa base de datos de sesiones). El token incluye `id`, `name`, `role` y `permissions`.

**Callbacks:**
- `jwt`: agrega datos del usuario al token
- `session`: expone datos del token a la sesión del cliente

### Middleware (`middleware.ts`)

Protege rutas bajo `/home/*` y `/api/protected/*`. Si no hay token JWT válido, redirige a `/` (login).

Usa `withAuth` de NextAuth con callback `authorized` que verifica existencia de token.

### Server action de auth (`app/actions/auth.server.ts`)

`getCurrentUserSession()` — obtiene la sesión del usuario actual en el servidor. Usada por server actions que necesitan identificar al operador (ej. recepciones, anticipos).

### Auditoría de login (`app/actions/loginAudit.ts`)

`logLoginAudit()` — registra cada intento de login (exitoso o fallido) en la tabla `audits` con IP, user agent y timestamp.

## Sistema de permisos

### Roles

| Rol | Comportamiento |
|-----|----------------|
| `ADMIN` | Acceso completo. Recibe automáticamente todos los permisos (`USERS_*`). |
| `OPERATOR` | Acceso según permisos asignados individualmente en tabla `permissions`. |

### Permisos granulares

Actualmente el sistema define permisos solo para el módulo de usuarios:

- `USERS_VIEW` — ver lista de usuarios
- `USERS_CREATE` — crear usuarios
- `USERS_UPDATE` — editar usuarios y permisos
- `USERS_DELETE` — eliminar usuarios

Definidos en `lib/permissions.ts`, gestionados por `app/actions/permissions.ts`.

### Control en UI

| Componente | Función |
|------------|---------|
| `PermissionsContext` (`app/state/`) | Provee permisos del usuario a toda la app |
| `usePermissions` hook | Acceso a permisos desde componentes |
| `Can` (`app/ui/permissions/Can.tsx`) | Renderiza children solo si el usuario tiene la habilidad requerida |

El layout principal envuelve la app con `PermissionsProvider` (en `app/Providers.tsx`), que carga los permisos al iniciar sesión.

## Seguridad de contraseñas

- Hash con **bcryptjs** al crear/actualizar usuarios
- Comparación segura en el provider de NextAuth
- Las contraseñas nunca se exponen en respuestas de API ni en auditoría

## Providers de la aplicación (`app/Providers.tsx`)

Envuelve toda la app con:
1. `SessionProvider` (NextAuth) — sesión en cliente
2. `PermissionsProvider` — permisos del usuario
3. `AlertProvider` — sistema de notificaciones/alertas
