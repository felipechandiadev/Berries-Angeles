export type GridSlot = {
    row: number;
    col: number;
    colSpan?: number;
};
/** Columnas del header desktop: Add+título | vacío | Toolbar+Search */
export declare const HEADER_GRID_COLUMNS = 3;
export declare const HEADER_GRID_TEMPLATE_COLUMNS = "auto minmax(0, 1fr) auto";
/** Primera fila de acciones (fila 1 reservada para Add+título y Toolbar). */
export declare const HEADER_ACTIONS_FIRST_ROW = 2;
/**
 * Coloca headerActions en un grid de 3 columnas:
 * - Fila 1: col 1 = Add+título, col 2 vacía, col 3 = Toolbar.
 * - Fila 2+: cols 1–3 = acciones (izq → der, 3 por fila).
 * - Ítems con `fullWidthFlags[i]` ocupan la fila completa (`colSpan: 3`).
 */
export declare function getActionSlotPositions(count: number, fullWidthFlags?: readonly boolean[]): GridSlot[];
//# sourceMappingURL=headerGridPlacement.d.ts.map