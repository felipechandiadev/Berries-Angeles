'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import IconButton from '../../IconButton';
/**
 * Acciones de fila del DataGrid — referencia de norma (ver `.instructions/webadmin.instruction`):
 * - Cada `IconButton`: `variant="action"` y `size="sm"` (no usar `text` u otros con colores sueltos).
 * - En la columna, `headerName: ''` (título de encabezado vacío) y `filterable: false` si aplica.
 */
export const RowActions = ({ row, column: _column }) => {
    var _a, _b, _c;
    const handleEdit = () => {
        console.log('Editar fila:', row);
    };
    const handleDelete = () => {
        console.log('Eliminar fila:', row);
    };
    const handleView = () => {
        console.log('Ver detalles de fila:', row);
    };
    return (_jsxs("div", { className: "flex items-center gap-1 justify-center", "data-test-id": `data-grid-row-actions-${(_c = (_b = (_a = row.id) !== null && _a !== void 0 ? _a : row._id) !== null && _b !== void 0 ? _b : row.key) !== null && _c !== void 0 ? _c : row.index}`, children: [_jsx(IconButton, { icon: "Eye", variant: "action", size: "sm", title: "Ver detalles", ariaLabel: "Ver detalles", onClick: handleView }), _jsx(IconButton, { icon: "Pencil", variant: "action", size: "sm", title: "Editar", ariaLabel: "Editar", onClick: handleEdit }), _jsx(IconButton, { icon: "Trash2", variant: "action", size: "sm", title: "Eliminar", ariaLabel: "Eliminar", onClick: handleDelete })] }));
};
// Ejemplo de uso en configuración de columnas:
/*
const columns: DataGridColumn[] = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: 'Nombre', flex: 1 },
  {
    field: 'actions',
    headerName: '', // norma: vacío
    width: 120,
    minWidth: 120,
    align: 'center',
    sortable: false,
    filterable: false,
    actionComponent: RowActions,
  },
];
*/
export default RowActions;
//# sourceMappingURL=RowActions.js.map