import React from 'react';
import { type ColumnStyle } from '../utils/columnStyles';
import type { DataGridColumn, DataGridRowAppearance, DataGridRowAppearanceContext } from '../DataGrid';
interface BodyProps {
    columns?: DataGridColumn[];
    rows?: any[];
    filterMode?: boolean;
    /** Estilos de columna precalculados en DataGrid (misma fuente que ColHeader). */
    computedColumnStyles?: ColumnStyle[];
    screenWidth?: number;
    expandable?: boolean;
    expandedRowIds?: Set<string | number>;
    onToggleExpand?: (rowId: string | number) => void;
    expandableRowContent?: (row: any) => React.ReactNode;
    pinActionsColumn?: boolean;
    actionsColumnField?: string;
    /** Si está definido y la fila está expandida, la fila de datos queda `sticky` bajo el header al hacer scroll. */
    stickyExpandedRowTopPx?: number;
    onRowClick?: (row: any) => void;
    selectedRowId?: string | number | null;
    getRowAppearance?: (ctx: DataGridRowAppearanceContext) => DataGridRowAppearance | null | undefined;
}
declare const Body: React.FC<BodyProps>;
export default Body;
//# sourceMappingURL=Body.d.ts.map