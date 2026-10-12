import React from 'react';
import { type DataGridCellOverflow } from './utils/columnStyles';
export type { DataGridCellOverflow };
import type { DataGridPaginationChange } from './components/Pagination';
export type DataGridColumnType = 'string' | 'number' | 'date' | 'dateTime' | 'boolean' | 'id';
export interface DataGridColumn {
    field: string;
    headerName: string;
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    flex?: number;
    type?: DataGridColumnType;
    sortable?: boolean;
    editable?: boolean;
    filterable?: boolean;
    renderCell?: (params: any) => React.ReactNode;
    renderType?: 'currency' | 'badge' | 'dateString';
    valueGetter?: (params: any) => any;
    align?: 'left' | 'right' | 'center';
    headerAlign?: 'left' | 'right' | 'center';
    hide?: boolean;
    /**
     * Contenido largo en la celda: `truncate` (ellipsis, default), `wrap`, `clip` u `visible`.
     * Aplica a texto por defecto, `renderCell` y `actionComponent` (contenedor con `min-w-0`).
     */
    cellOverflow?: DataGridCellOverflow;
    sticky?: boolean;
    /**
     * Acciones de fila. Norma: columna con `field` típ. `'actions'`, `headerName: ''`, `filterable: false`, `sortable: false`;
     * en el componente, IconButtons con `variant="action"` y `size="sm"`.
     */
    actionComponent?: React.ComponentType<{
        row: any;
        column: DataGridColumn;
    }>;
}
/** Variante del botón de alta en el header del DataGrid. */
export type DataGridAddButtonVariant = 'icon' | 'pillOutlined';
export type DataGridRowAppearance = {
    /** Color de fondo de la fila (celdas + columna expand). CSS válido. */
    backgroundColor?: string;
    /** Clases extra en cada celda de la fila. */
    className?: string;
    /** Slug en `data-row-appearance` (tests / analytics). */
    variant?: string;
};
export type DataGridRowAppearanceContext = {
    row: unknown;
    rowIndex: number;
    isSelected: boolean;
    isExpanded: boolean;
};
export interface DataGridProps {
    columns: DataGridColumn[];
    title?: string;
    rows?: any[];
    /** Estado de carga (server-side). En `paginationMode="controlled"` controla el skeleton del cuerpo. */
    loading?: boolean;
    enableSearch?: boolean;
    enablePagination?: boolean;
    sort?: 'asc' | 'desc';
    sortField?: string;
    search?: string;
    filters?: string;
    height?: number | string;
    /**
     * Ajusta la altura del grid para que el pie quede al borde inferior del viewport;
     * el cuerpo (filas) hace scroll dentro del espacio restante. Ignora `height` si está activo.
     */
    fillViewport?: boolean;
    /**
     * Grid bajo {@link TabPageLayout} (fila de pestañas encima): el fallback CSS resta altura extra
     * hasta medir; la altura en px sigue usando el `top` real del contenedor.
     */
    fillViewportInTabLayout?: boolean;
    /** Margen inferior en px al calcular `fillViewport` (p. ej. `pb-6` del `<main>`). Default 24. */
    viewportBottomInset?: number;
    totalRows?: number;
    totalGeneral?: number;
    createForm?: React.ReactNode;
    createFormTitle?: string;
    onAddClick?: () => void;
    addDisabled?: boolean;
    /** `icon` (default): IconButton +. `pillOutlined`: ButtonPill outlined con icono + y texto (p. ej. "Recepción"). */
    addButtonVariant?: DataGridAddButtonVariant;
    /** Texto del pill outlined (el icono + va aparte, sin prefijo en el texto). */
    addButtonLabel?: string;
    ["data-test-id"]?: string;
    excelUrl?: string;
    excelFields?: string;
    limit?: number;
    onExportExcel?: () => Promise<void>;
    showBorder?: boolean;
    showSortButton?: boolean;
    showFilterButton?: boolean;
    showExportButton?: boolean;
    showSearch?: boolean;
    onSearchChange?: (value: string) => void;
    expandable?: boolean;
    expandableRowContent?: (row: any) => React.ReactNode;
    defaultExpandedRowIds?: (string | number)[];
    headerActions?: React.ReactNode;
    pinActionsColumn?: boolean;
    actionsColumnField?: string;
    /** Clic en la fila (p. ej. cambiar selección vía URL). */
    onRowClick?: (row: any) => void;
    /** Resalta la fila cuyo `row.id` coincide (selección controlada desde fuera). */
    selectedRowId?: string | number | null;
    /**
     * Apariencia condicional por fila (fondo, clases, variant para tests).
     * Prioridad de fondo: selección > apariencia custom > hover > default.
     */
    getRowAppearance?: (ctx: DataGridRowAppearanceContext) => DataGridRowAppearance | null | undefined;
    /** Oculta pie de paginación (listas cortas estáticas). */
    showFooter?: boolean;
    /**
     * `url` (default): `page` y `limit` en la URL de la página.
     * `controlled`: paginación vía props (diálogos, paneles embebidos).
     */
    paginationMode?: 'url' | 'controlled';
    page?: number;
    onPaginationChange?: (next: DataGridPaginationChange) => void;
}
declare const DataGrid: React.FC<DataGridProps>;
export default DataGrid;
//# sourceMappingURL=DataGrid.d.ts.map