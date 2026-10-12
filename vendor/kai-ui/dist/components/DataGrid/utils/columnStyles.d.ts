import type { DataGridColumn } from '../DataGrid';
export interface ColumnStyle {
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    flex?: string;
    overflow?: string;
}
/** Clases compartidas para filas header/body: mismo ancho intrínseco al hacer scroll horizontal. */
export declare const DATA_GRID_COLUMN_ROW_CLASS = "flex w-max min-w-full";
/** Cómo trata el contenido largo la celda respecto al ancho de columna. */
export type DataGridCellOverflow = 'truncate' | 'wrap' | 'clip' | 'visible';
/**
 * Clases Tailwind para celda y contenedor interno según `cellOverflow`.
 * La celda incluye `min-w-0` para que flex no la expanda por contenido largo.
 */
export declare function getCellOverflowClassNames(mode?: DataGridCellOverflow): {
    cell: string;
    content: string;
};
export declare function resolveColumnCellOverflow(column: {
    cellOverflow?: DataGridCellOverflow;
}): DataGridCellOverflow;
export type DataGridColumnAlign = 'left' | 'center' | 'right';
/** Padding horizontal compartido entre header y body (tokens de densidad). */
export declare const DataGridCellMetrics: {
    readonly paddingX: "px-[var(--datagrid-cell-padding-x,0.75rem)]";
    readonly paddingY: "py-[var(--datagrid-cell-padding-y,0.25rem)]";
};
export declare function resolveColumnAlign(column: {
    align?: DataGridColumnAlign;
    headerAlign?: DataGridColumnAlign;
}, target: 'header' | 'body'): DataGridColumnAlign;
export declare function getColumnAlignClassNames(align: DataGridColumnAlign): {
    cell: string;
    content: string;
};
/**
 * Hook personalizado para detectar tamaño de pantalla
 */
export declare function useScreenSize(): {
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
};
/**
 * Utilidad centralizada para calcular estilos de columna de DataGrid.
 * `layoutWidth` = ancho real del área scroll del grid (no window.innerWidth).
 */
export declare function calculateColumnStyles(columns: DataGridColumn[], layoutWidth?: number): ColumnStyle[];
/**
 * Capas sticky del DataGrid (scroll vertical u horizontal).
 * El header y la esquina de acciones deben quedar por encima de las celdas de acciones del body.
 */
export declare const DataGridZIndex: {
    readonly bodyPinnedCell: 1;
    readonly headerRow: 20;
    readonly headerPinnedCell: 21;
    readonly expandedStickyRow: 15;
    readonly expandedContent: 14;
};
/**
 * Constantes para estilos consistentes del DataGrid
 */
export declare const DataGridStyles: {
    readonly container: "rounded-md flex flex-col";
    readonly scrollContainer: "min-h-0 flex-1 overflow-auto";
    readonly headerRow: "flex w-max min-w-full";
    readonly headerCell: "px-3 py-2 text-sm font-medium text-foreground border-r border-border last:border-r-0";
    readonly bodyCell: "px-3 py-1 text-sm text-foreground border-b border-border border-r border-border whitespace-pre-line break-words min-h-[22px] flex-auto last:border-r-0";
    readonly responsive: {
        readonly minWidth: "min-w-[280px] sm:min-w-[400px] md:min-w-[600px]";
        readonly mobileScroll: "sm:overflow-x-visible overflow-x-auto";
    };
};
//# sourceMappingURL=columnStyles.d.ts.map