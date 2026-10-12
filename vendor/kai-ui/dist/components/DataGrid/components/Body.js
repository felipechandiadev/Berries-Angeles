'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo, useState } from 'react';
import { calculateColumnStyles, DATA_GRID_COLUMN_ROW_CLASS, getCellOverflowClassNames, resolveColumnCellOverflow, DataGridZIndex, DataGridCellMetrics, getColumnAlignClassNames, resolveColumnAlign, } from '../utils/columnStyles';
import { resolveRowCellBackgroundColor } from '../utils/rowAppearance';
import IconButton from '../../IconButton';
import dataGridChrome from '../dataGridChrome.module.css';
const CELL_BASE_CLASS = `${DataGridCellMetrics.paddingX} ${DataGridCellMetrics.paddingY} ${dataGridChrome.subtleLineBottom} text-xs flex min-w-0 box-border items-center`;
function cellOverflowClasses(column) {
    return getCellOverflowClassNames(resolveColumnCellOverflow(column));
}
const Body = ({ columns = [], rows = [], filterMode = false, computedColumnStyles, screenWidth = 1024, expandable = false, expandedRowIds = new Set(), onToggleExpand, expandableRowContent, pinActionsColumn = false, actionsColumnField = 'actions', stickyExpandedRowTopPx, onRowClick, selectedRowId = null, getRowAppearance, }) => {
    const [hoveredRowId, setHoveredRowId] = useState(null);
    const visibleColumns = columns.filter((c) => !c.hide);
    // Usar utilidad centralizada para calcular estilos
    const computedStyles = useMemo(() => computedColumnStyles !== null && computedColumnStyles !== void 0 ? computedColumnStyles : calculateColumnStyles(columns, screenWidth), [computedColumnStyles, columns, screenWidth]);
    return (_jsx("div", { className: "flex-1", "data-test-id": "data-grid-body", children: rows.map((row, rowIndex) => {
            var _a, _b, _c;
            const rowId = (_a = row.id) !== null && _a !== void 0 ? _a : rowIndex;
            const isExpanded = expandedRowIds.has(rowId);
            const isSelected = selectedRowId != null && selectedRowId !== '' && String(rowId) === String(selectedRowId);
            const rowAppearance = getRowAppearance === null || getRowAppearance === void 0 ? void 0 : getRowAppearance({
                row,
                rowIndex,
                isSelected,
                isExpanded,
            });
            const isHovered = hoveredRowId === rowId;
            const rowBackgroundColor = resolveRowCellBackgroundColor({
                isSelected,
                isHovered,
                isExpanded,
                appearance: rowAppearance,
            });
            const rowAppearanceClassName = (_c = (_b = rowAppearance === null || rowAppearance === void 0 ? void 0 : rowAppearance.className) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : '';
            /** Si solo hay clases Tailwind `bg-*`, no pisarlas con `backgroundColor` inline (hover/default).
                Excepción: una fila expandida siempre fuerza el fondo blanco inline. */
            const rowAppearanceUsesBgClass = !isExpanded &&
                Boolean(rowAppearanceClassName) &&
                /\bbg-/.test(rowAppearanceClassName) &&
                !(rowAppearance === null || rowAppearance === void 0 ? void 0 : rowAppearance.backgroundColor);
            return (_jsxs(React.Fragment, { children: [_jsxs("div", { role: onRowClick ? 'button' : undefined, tabIndex: onRowClick ? 0 : undefined, onKeyDown: onRowClick
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onRowClick(row);
                                }
                            }
                            : undefined, onClick: onRowClick ? () => onRowClick(row) : undefined, className: `${DATA_GRID_COLUMN_ROW_CLASS} items-stretch data-grid-row ${onRowClick ? 'cursor-pointer' : ''} ${expandable && isExpanded && stickyExpandedRowTopPx != null
                            ? `sticky ${dataGridChrome.subtleLineBottom} bg-background shadow-sm`
                            : ''}`, style: Object.assign({}, (expandable && isExpanded && stickyExpandedRowTopPx != null
                            ? { top: stickyExpandedRowTopPx, zIndex: DataGridZIndex.expandedStickyRow }
                            : undefined)), "data-test-id": "data-grid-row", "data-row-appearance": rowAppearance === null || rowAppearance === void 0 ? void 0 : rowAppearance.variant, "aria-selected": onRowClick ? isSelected : undefined, children: [expandable && (_jsx("div", { className: `w-10 min-w-[40px] px-1 py-1 ${dataGridChrome.subtleLineBottom} flex items-center justify-center ${rowAppearanceClassName}`, style: rowAppearanceUsesBgClass && !isSelected
                                    ? undefined
                                    : { backgroundColor: rowBackgroundColor }, onMouseEnter: () => setHoveredRowId(rowId), onMouseLeave: () => setHoveredRowId(null), children: _jsx(IconButton, { icon: "ChevronDown", variant: "action", size: "sm", onClick: () => onToggleExpand === null || onToggleExpand === void 0 ? void 0 : onToggleExpand(rowId), className: `transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`, ariaLabel: isExpanded ? 'Colapsar fila' : 'Expandir fila' }) })), visibleColumns.map((column, colIndex) => {
                                var _a, _b;
                                // compute raw value from row field
                                const rawValue = row[column.field];
                                const style = computedStyles[colIndex];
                                const isPinnedActionsColumn = pinActionsColumn && column.field === actionsColumnField;
                                const cellStyle = Object.assign(Object.assign(Object.assign({}, style), (rowAppearanceUsesBgClass && !isSelected
                                    ? {}
                                    : { backgroundColor: rowBackgroundColor })), (isPinnedActionsColumn
                                    ? {
                                        position: 'sticky',
                                        right: 0,
                                        zIndex: DataGridZIndex.bodyPinnedCell,
                                        flex: typeof column.width === 'number'
                                            ? `0 0 ${column.width}px`
                                            : '0 0 auto',
                                        width: column.width,
                                        minWidth: (_a = column.minWidth) !== null && _a !== void 0 ? _a : column.width,
                                        maxWidth: (_b = column.maxWidth) !== null && _b !== void 0 ? _b : column.width,
                                    }
                                    : {}));
                                // if a valueGetter is provided, use it to derive the value
                                const value = column.valueGetter
                                    ? column.valueGetter({ row, value: rawValue, column, rowIndex })
                                    : rawValue;
                                const alignClasses = getColumnAlignClassNames(resolveColumnAlign(column, 'body'));
                                const overflow = cellOverflowClasses(column);
                                const overflowMode = resolveColumnCellOverflow(column);
                                const cellClassName = `${CELL_BASE_CLASS} ${alignClasses.cell} ${overflowMode === 'wrap' ? 'items-start' : 'items-center'} ${overflow.cell} ${rowAppearanceClassName}`.trim();
                                const displayText = value !== null && value !== undefined ? String(value) : '-';
                                const cellTitle = resolveColumnCellOverflow(column) === 'truncate' && displayText !== '-'
                                    ? displayText
                                    : undefined;
                                // Renderizar actionComponent si existe
                                if (column.actionComponent) {
                                    const ActionComponent = column.actionComponent;
                                    return (_jsx("div", { className: cellClassName, style: cellStyle, onMouseEnter: () => setHoveredRowId(rowId), onMouseLeave: () => setHoveredRowId(null), children: _jsx("div", { className: `${overflow.content} ${alignClasses.content}`, children: _jsx(ActionComponent, { row: row, column: column }) }) }, `${column.field}-${rowId}`));
                                }
                                // Usar renderCell personalizado si existe
                                if (column.renderCell) {
                                    return (_jsx("div", { className: cellClassName, style: cellStyle, onMouseEnter: () => setHoveredRowId(rowId), onMouseLeave: () => setHoveredRowId(null), children: _jsx("div", { className: `${overflow.content} ${alignClasses.content}`, children: column.renderCell({ row, value, column }) }) }, `${column.field}-${rowId}`));
                                }
                                return (_jsx("div", { className: cellClassName, style: cellStyle, onMouseEnter: () => setHoveredRowId(rowId), onMouseLeave: () => setHoveredRowId(null), children: _jsx("span", { className: `${overflow.content} ${alignClasses.content}`, title: cellTitle, children: displayText }) }, `${column.field}-${rowId}`));
                            })] }), expandable && isExpanded && expandableRowContent && (_jsx("div", { className: `sticky left-0 w-full min-w-0 max-w-full overflow-x-hidden ${dataGridChrome.subtleLineBottom} bg-neutral/50`, style: { zIndex: DataGridZIndex.expandedContent }, "data-test-id": "data-grid-expanded-row", children: _jsx("div", { className: "box-border w-full min-w-0 max-w-full overflow-x-hidden p-4", children: expandableRowContent(row) }) }))] }, rowId));
        }) }));
};
export default Body;
//# sourceMappingURL=Body.js.map