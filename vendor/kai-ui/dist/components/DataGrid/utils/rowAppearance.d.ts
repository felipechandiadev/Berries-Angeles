import type { DataGridRowAppearance } from '../DataGrid';
/**
 * Prioridad: selección > apariencia custom > hover > default.
 */
export declare function resolveRowCellBackgroundColor(params: {
    isSelected: boolean;
    isHovered: boolean;
    isExpanded?: boolean;
    appearance?: DataGridRowAppearance | null;
}): string;
//# sourceMappingURL=rowAppearance.d.ts.map