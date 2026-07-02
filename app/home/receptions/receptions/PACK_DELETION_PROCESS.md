# Proceso de Eliminación de Packs en Recepciones

## Resumen Ejecutivo

La eliminación de un pack en una recepción es una operación crítica que afecta múltiples aspectos del sistema: inventario de bandejas, asignaciones de pallets, transacciones financieras y auditoría. Este documento detalla el proceso completo, sus implicaciones y efectos globales.

## Proceso de Eliminación

### 1. Inicio del Proceso
- El usuario accede a la sección de recepción y selecciona un pack específico
- Hace clic en el botón de eliminación (ícono de papelera) en la tarjeta del pack
- Se abre el diálogo de confirmación de eliminación

### 2. Diálogo de Configuración
El diálogo presenta dos opciones principales para manejar las bandejas del pack:

#### Opción A: Ajustar Stock Interno
- **Descripción**: Descuenta las bandejas del inventario interno sin registrar devolución al productor
- **Uso**: Para correcciones administrativas o pérdidas operativas
- **Transacciones creadas**:
  - `TRAY_ADJUSTMENT`: Ajuste negativo en el stock de bandejas
  - `PALLET_TRAY_RELEASE`: Liberación de bandejas de pallets asignados (si aplica)

#### Opción B: Devolver al Productor
- **Descripción**: Registra la salida de bandejas al productor como devolución asociada a esta recepción
- **Uso**: Para devoluciones legítimas o correcciones de recepción
- **Transacciones creadas**:
  - `TRAY_OUT_TO_PRODUCER`: Movimiento de salida de bandejas al productor
  - `PALLET_TRAY_RELEASE`: Liberación de bandejas de pallets asignados (si aplica)

### 3. Requisitos Obligatorios
- **Motivo**: Campo obligatorio que explica la razón de la eliminación
- **Observaciones**: Campo opcional para notas internas adicionales

### 4. Validación y Ejecución
- El sistema valida que se haya proporcionado un motivo
- Se ejecuta la acción `removeReceptionPack` en el backend
- Se crean las transacciones correspondientes con metadata detallada
- Se actualizan los totales de la recepción

## Implicaciones Técnicas

### Backend (app/actions/receptions.ts)
La función `removeReceptionPack` maneja:
- Cálculo de totales a revertir (peso, cantidad, valor)
- Creación de transacciones compensatorias
- Actualización de asignaciones de pallets
- Registro de relaciones entre transacciones
- Actualización de auditoría

### Base de Datos
- **Transacciones**: Nuevos registros con tipos específicos y metadata
- **Relaciones**: Enlaces entre transacción padre (recepción) e hijas (ajustes/devoluciones)
- **Auditoría**: Registro de cambios con usuario, entidad y detalles

### Metadata de Transacciones
```typescript
TrayAdjustmentMetadata: {
  packId: string;
  traysQuantity: number;
  trayId: string;
  reason: string;
  notes?: string;
}

TrayMovementMetadata: {
  packId: string;
  traysQuantity: number;
  trayId: string;
  producerId: string;
  reason: string;
  notes?: string;
}
```

## Efectos en Otras Secciones

### 1. Sección de Inventario
- **Stock de Bandejas**: Se reduce según la cantidad eliminada
- **Pallets**: Se liberan espacios ocupados por las bandejas del pack
- **Disponibilidad**: Afecta cálculos de capacidad y asignaciones futuras

### 2. Sección de Recepciones
- **Totales de Recepción**: Se recalculan pesos, cantidades y valores
- **Lista de Packs**: El pack eliminado desaparece de la vista
- **Resumen**: Actualización automática de métricas generales

### 3. Sección de Movimientos/Historial
- **Transacciones**: Aparecen nuevas entradas de ajuste o devolución
- **Relaciones**: Enlaces visibles entre recepción original y compensaciones
- **Auditoría**: Nuevos registros de eliminación con detalles completos

### 4. Sección de Productores
- **Devoluciones**: Si se elige "devolver al productor", afecta saldos y relaciones
- **Historial**: Registro de movimientos asociados a recepciones específicas

### 5. Reportes y Análisis
- **Inventario Histórico**: Cambios reflejados en tendencias de stock
- **Productividad**: Afecta métricas de eficiencia y correcciones
- **Auditoría**: Trail completo para compliance y trazabilidad

## Efectos Globales

### 1. Consistencia de Datos
- Todas las transacciones mantienen referencias cruzadas
- Los totales se actualizan automáticamente en cascada
- La auditoría garantiza trazabilidad completa

### 2. Integridad del Sistema
- No se permiten eliminaciones sin motivo justificado
- Las compensaciones mantienen el balance de inventario
- Los pallets se liberan correctamente para reasignación

### 3. Impacto en Usuarios
- **Operadores**: Pueden corregir errores sin perder trazabilidad
- **Auditores**: Acceso completo al historial de cambios
- **Administradores**: Visibilidad de ajustes y correcciones

### 4. Rendimiento del Sistema
- Operaciones atómicas para evitar estados inconsistentes
- Índices optimizados en tablas de transacciones y relaciones
- Caché actualizado automáticamente

## Consideraciones de Seguridad

### Autorización
- Solo usuarios con permisos adecuados pueden eliminar packs
- Registro automático del usuario que realiza la eliminación

### Validación
- Motivo obligatorio previene eliminaciones accidentales
- Confirmación explícita en el diálogo de eliminación

### Auditoría
- Todos los cambios se registran con timestamp y usuario
- Metadata completa para análisis forense si es necesario

## Casos de Uso Comunes

### Corrección de Recepción
1. Pack registrado por error
2. Seleccionar "Ajustar Stock Interno"
3. Proporcionar motivo detallado
4. Sistema revierte automáticamente todos los efectos

### Devolución al Productor
1. Producto dañado o no conforme
2. Seleccionar "Devolver al Productor"
3. Sistema registra movimiento de salida
4. Productor puede ver devolución en su historial

### Ajuste Administrativo
1. Cambio en política de inventario
2. Seleccionar modo apropiado según contexto
3. Documentar cambios para auditoría

## Monitoreo y Mantenimiento

### Logs
- Todas las operaciones se registran en logs del sistema
- Errores se reportan con contexto completo

### Métricas
- Número de eliminaciones por período
- Motivos más comunes
- Impacto en inventario promedio

### Alertas
- Eliminaciones inusuales generan notificaciones
- Umbrales configurables para monitoreo

Este proceso asegura que las eliminaciones de packs sean controladas, auditables y mantengan la integridad del sistema mientras permiten correcciones necesarias en operaciones diarias.</content>
<parameter name="filePath">/Users/felipe/dev/ElectNextStart/app/home/receptions/receptions/PACK_DELETION_PROCESS.md