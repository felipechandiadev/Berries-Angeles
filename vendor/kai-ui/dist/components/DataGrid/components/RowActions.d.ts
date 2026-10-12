import React from 'react';
import type { DataGridColumn } from '../DataGrid';
interface RowActionsProps {
    row: any;
    column: DataGridColumn;
}
/**
 * Acciones de fila del DataGrid — referencia de norma (ver `.instructions/webadmin.instruction`):
 * - Cada `IconButton`: `variant="action"` y `size="sm"` (no usar `text` u otros con colores sueltos).
 * - En la columna, `headerName: ''` (título de encabezado vacío) y `filterable: false` si aplica.
 */
export declare const RowActions: React.FC<RowActionsProps>;
export default RowActions;
//# sourceMappingURL=RowActions.d.ts.map