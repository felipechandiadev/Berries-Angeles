'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useRef, useState, useEffect } from 'react';
import IconButton from '../../IconButton';
import { DataGridCellMetrics, DataGridZIndex, getColumnAlignClassNames, resolveColumnAlign } from '../utils/columnStyles';
import dataGridChrome from '../dataGridChrome.module.css';
import { useSearchParams, useRouter } from '../../../navigation';
// Parse filters from URL format: "column1-value1,column2-value2"
function parseFiltersFromUrl(filtersParam) {
    if (!filtersParam)
        return {};
    const filters = {};
    const filterPairs = filtersParam.split(',');
    filterPairs.forEach(pair => {
        const [column, ...valueParts] = pair.split('-');
        if (column && valueParts.length > 0) {
            filters[column] = decodeURIComponent(valueParts.join('-')); // Decode to handle special chars
        }
    });
    return filters;
}
export const ColHeader = ({ column, computedStyle, filterMode = false, isPinned = false, sortingEnabled = true, }) => {
    var _a, _b;
    const { headerName, width, flex, minWidth, maxWidth, field, filterable = true } = column;
    const headerAlignClasses = getColumnAlignClassNames(resolveColumnAlign(column, 'header'));
    const searchParams = useSearchParams();
    const router = useRouter();
    const debounceTimer = useRef(null);
    // Get current sort state from URL
    const currentSort = searchParams.get('sort');
    const currentSortField = searchParams.get('sortField');
    const isThisColumnSorted = currentSortField === field;
    // Sort is globally active only when there are sort params in the URL
    const isSortGloballyActive = Boolean(currentSort || currentSortField);
    // Show sort icon only if: sort is active in URL AND this column is sortable
    const hasSortIcon = isSortGloballyActive && Boolean(column.sortable);
    // Get current filter value for this column from URL
    const filtersParam = searchParams.get('filters') || '';
    const currentFilters = parseFiltersFromUrl(filtersParam);
    const filterValueFromUrl = currentFilters[field] || '';
    // Local state for the input - initialize from URL
    const [localFilterValue, setLocalFilterValue] = useState(filterValueFromUrl);
    // Track if we're in the middle of typing (debounce pending)
    const isTypingRef = useRef(false);
    // Sync local state with URL only when URL changes externally (not from our own typing)
    useEffect(() => {
        if (!isTypingRef.current) {
            setLocalFilterValue(filterValueFromUrl);
        }
    }, [filterValueFromUrl]);
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);
    // Handle filter change with debounce
    const handleFilterChange = useCallback((e) => {
        const value = e.target.value;
        setLocalFilterValue(value);
        isTypingRef.current = true;
        // Clear previous timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        // Set new timer for 300ms debounce
        debounceTimer.current = setTimeout(() => {
            isTypingRef.current = false;
            const params = new URLSearchParams(searchParams.toString());
            // Update filters parameter
            const currentFilters = parseFiltersFromUrl(params.get('filters') || '');
            if (value.trim() === '') {
                // Remove this column's filter if input is empty
                delete currentFilters[field];
            }
            else {
                // Set/update this column's filter
                currentFilters[field] = value;
            }
            // Build new filters string
            const newFiltersString = Object.entries(currentFilters)
                .filter(([_, filterValue]) => filterValue.trim() !== '')
                .map(([column, filterValue]) => `${column}-${encodeURIComponent(filterValue)}`)
                .join(',');
            if (newFiltersString) {
                params.set('filters', newFiltersString);
                params.set('filtration', 'true');
            }
            else {
                params.delete('filters');
                // NO eliminar filtration aquí: solo la Toolbar puede quitar filtration
                params.set('filtration', 'true');
            }
            // Reset to page 1 when filtering
            params.set('page', '1');
            router.replace(`?${params.toString()}`, { scroll: false });
        }, 300);
    }, [searchParams, router, field]);
    // Handle sort click - toggle between asc/desc if this column is active, or activate this column
    const handleSortClick = () => {
        if (!column.sortable)
            return;
        const params = new URLSearchParams(searchParams.toString());
        if (isThisColumnSorted) {
            // If this column is already sorted, toggle the direction
            const newDirection = currentSort === 'asc' ? 'desc' : 'asc';
            params.set('sort', newDirection);
            params.set('sortField', field);
        }
        else {
            // If this column is not sorted, activate it with ascending order
            params.set('sort', 'asc');
            params.set('sortField', field);
        }
        params.set('page', '1');
        router.replace(`?${params.toString()}`, { scroll: false });
    };
    // Determine which icon to show and its color (Lucide names for IconButton)
    let iconName;
    let iconColor;
    if (!column.sortable) {
        iconName = 'ArrowUp';
        iconColor = "text-muted-foreground";
    }
    else if (isThisColumnSorted) {
        // If this column is sorted, show the appropriate direction icon in primary color
        iconName = currentSort === 'asc' ? 'ArrowUp' : 'ArrowDown';
        iconColor = 'text-primary';
    }
    else {
        // If sortable but not sorted, show upward arrow in secondary color (lighter)
        iconName = 'ArrowUp';
        iconColor = "text-muted-foreground hover:text-secondary";
    }
    const fallbackHeaderStyle = computedStyle
        ? {}
        : Object.assign(Object.assign(Object.assign(Object.assign({}, (flex !== undefined ? { flex } : {})), (width !== undefined ? { width } : {})), (minWidth !== undefined ? { minWidth } : {})), (maxWidth !== undefined ? { maxWidth } : {}));
    return (_jsx("div", { className: `${dataGridChrome.subtleLineBottom} ${DataGridCellMetrics.paddingX} ${DataGridCellMetrics.paddingY} box-border min-w-0 font-semibold text-xs text-foreground flex items-center ${headerAlignClasses.cell}`, style: Object.assign(Object.assign(Object.assign(Object.assign({ height: '56px', minHeight: '56px', maxHeight: '56px' }, fallbackHeaderStyle), (computedStyle || {})), { position: 'relative', zIndex: isPinned ? DataGridZIndex.headerPinnedCell : 2 }), (isPinned
            ? {
                position: 'sticky',
                top: 0,
                right: 0,
                zIndex: DataGridZIndex.headerPinnedCell,
                flex: typeof column.width === 'number'
                    ? `0 0 ${column.width}px`
                    : '0 0 auto',
                width: column.width,
                minWidth: (_a = column.minWidth) !== null && _a !== void 0 ? _a : column.width,
                maxWidth: (_b = column.maxWidth) !== null && _b !== void 0 ? _b : column.width,
            }
            : {})), "data-test-id": `data-grid-column-header-${field}`, children: filterMode && filterable ? (_jsxs("div", { className: "relative flex h-full min-w-0 w-full flex-1 items-center justify-start overflow-hidden", children: [localFilterValue && (_jsx("label", { className: "absolute left-0 text-[10px] text-foreground bg-white px-0 pointer-events-none z-10 transition-all duration-200 text-left", style: { lineHeight: 1, top: '2px' }, children: headerName })), _jsx("input", { type: "text", size: 1, value: localFilterValue, onChange: handleFilterChange, placeholder: headerName, className: `block w-full min-w-0 max-w-full text-xs h-[28px] bg-transparent outline-none p-0 border-0 ${localFilterValue ? 'text-secondary pt-3' : ''} text-left`, "aria-label": headerName, style: { width: '100%', minWidth: 0, maxWidth: '100%', border: 'none' } })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: `min-w-0 flex-1 truncate ${headerAlignClasses.content}`, children: headerName }), hasSortIcon ? (_jsx("div", { className: "ml-1 flex h-7 w-7 shrink-0 items-center justify-center", children: _jsx(IconButton, { icon: iconName, variant: "action", size: "sm", title: isThisColumnSorted ?
                            (currentSort === 'asc' ? 'Cambiar a descendente' : 'Cambiar a ascendente') :
                            'Ordenar por esta columna', onClick: handleSortClick, className: iconColor, style: { fontSize: 18, width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }, "aria-hidden": false }) })) : null] })) }));
};
export default ColHeader;
//# sourceMappingURL=ColHeader.js.map