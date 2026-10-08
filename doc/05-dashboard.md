# Dashboard

**Ruta:** `/home`
**Server action:** `app/actions/dashboard.ts`
**UI:** `app/home/page.tsx` + `app/home/ui/DashboardStats.tsx`

## Descripción

Panel principal de la aplicación. Es la primera pantalla que ve el usuario tras iniciar sesión. Muestra un resumen del estado operativo del negocio y la actividad reciente del sistema.

## Métricas mostradas

| Métrica | Fuente | Descripción |
|---------|--------|-------------|
| Total usuarios | `users` (no eliminados) | Cantidad de cuentas activas |
| Total productores | `producers` (no eliminados) | Productores registrados |
| Total recepciones | `transactions` tipo `RECEPTION` | Recepciones procesadas |
| Total anticipos | `transactions` tipo `ADVANCE` | Anticipos registrados |
| Pallets disponibles | `pallets` status `AVAILABLE` | Pallets listos para asignar |
| Temporada activa | `seasons` con `active = 1` | Nombre de la temporada vigente |

## Actividad reciente

Muestra las últimas 8 entradas de la tabla `audits`, ordenadas por fecha descendente. Cada entrada incluye:

- Acción realizada (CREATE, UPDATE, DELETE, LOGIN)
- Entidad afectada
- Descripción
- Fecha/hora (zona Chile)

## Implementación técnica

- **Server Component:** `app/home/page.tsx` obtiene sesión y stats en paralelo con `Promise.all`
- **Función principal:** `getDashboardStats()` ejecuta queries SQL directas para conteos y consulta de auditoría
- **Fallback:** si la BD no está disponible, retorna `EMPTY_STATS` con todos los valores en cero
- **Renderizado:** `DashboardStats` es un componente cliente que recibe los stats como props

## Navegación

El Dashboard es accesible desde el menú lateral (TopBar) como primer ítem. No requiere permisos especiales; cualquier usuario autenticado puede verlo.
