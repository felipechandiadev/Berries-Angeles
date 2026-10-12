'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from './components/Header';
import dataGridChrome from './dataGridChrome.module.css';
import Body from './components/Body';
import Footer from './components/Footer';
import { ColHeader } from './components/ColHeader';
import { calculateColumnStyles, DataGridStyles, useScreenSize, } from './utils/columnStyles';
import { DATA_GRID_TAB_LAYOUT_FALLBACK_EXTRA_PX, dataGridFillViewportFallbackHeight, useDataGridFillViewportHeight, } from './utils/useDataGridFillViewportHeight';
import { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from '../../navigation';
const DataGrid = ({ columns, title, rows, loading = false, enableSearch, // deprecated: map to showSearch
enablePagination, // deprecated: always enabled
sort, sortField, search, filters, height = '70vh', fillViewport = false, fillViewportInTabLayout = false, viewportBottomInset = 24, totalRows, totalGeneral, createForm, createFormTitle, onAddClick, addDisabled, addButtonVariant = 'icon', addButtonLabel, ["data-test-id"]: dataTestId, excelUrl, excelFields, limit = 25, onExportExcel, showBorder = false, showSortButton = true, showFilterButton = true, showExportButton = true, showSearch, onSearchChange, expandable = false, expandableRowContent, defaultExpandedRowIds = [], headerActions, pinActionsColumn = false, actionsColumnField = 'actions', onRowClick, selectedRowId = null, getRowAppearance, showFooter = true, paginationMode = 'url', page: controlledPage, onPaginationChange, }) => {
    // Map deprecated props to new ones
    const effectiveShowSearch = showSearch !== undefined ? showSearch : (enableSearch !== undefined ? enableSearch : true);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [data, setData] = useState(rows || []);
    const [total, setTotal] = useState(totalRows || (rows ? rows.length : 0));
    const [expandedRowIds, setExpandedRowIds] = useState(new Set(defaultExpandedRowIds));
    useEffect(() => {
        if (defaultExpandedRowIds.length === 0) {
            return;
        }
        setExpandedRowIds(new Set(defaultExpandedRowIds));
    }, [defaultExpandedRowIds.join("|")]);
    const containerRef = useRef(null);
    const scrollAreaRef = useRef(null);
    const columnHeaderRowRef = useRef(null);
    /** Wrapper (sin scrollbar) de la fila de encabezados; su scrollLeft se sincroniza con el body. */
    const columnHeaderScrollRef = useRef(null);
    const fillViewportHeightPx = useDataGridFillViewportHeight(fillViewport, containerRef, viewportBottomInset);
    const [gridWidth, setGridWidth] = useState(1024);
    useLayoutEffect(() => {
        const scrollEl = scrollAreaRef.current;
        if (!scrollEl) {
            return;
        }
        const measureGridWidth = () => {
            const width = scrollEl.clientWidth;
            if (width > 0) {
                setGridWidth(width);
            }
        };
        measureGridWidth();
        const gridWidthObserver = new ResizeObserver(() => {
            requestAnimationFrame(measureGridWidth);
        });
        gridWidthObserver.observe(scrollEl);
        return () => {
            gridWidthObserver.disconnect();
        };
    }, []);
    // Inicializar filterMode basado en si hay filtros activos en la URL
    const [filterMode, setFilterMode] = useState(() => {
        const filtration = searchParams.get('filtration') === 'true';
        return filtration;
    });
    // Hook para detectar tamaño de pantalla
    const { width: screenWidth, isMobile } = useScreenSize();
    const toggleFilterMode = () => setFilterMode((v) => !v);
    // Toggle expandir/colapsar una fila
    const toggleRowExpanded = (rowId) => {
        setExpandedRowIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(rowId)) {
                newSet.delete(rowId);
            }
            else {
                newSet.add(rowId);
            }
            return newSet;
        });
    };
    // Update data when rows prop changes (server-side updates)
    useEffect(() => {
        setData(rows || []);
        setTotal(totalRows || (rows ? rows.length : 0));
    }, [rows, totalRows]);
    // Sincronizar filterMode con la URL
    useEffect(() => {
        const filtration = searchParams.get('filtration') === 'true';
        setFilterMode(filtration);
    }, [searchParams]);
    // Inicializar limit en la URL si no está presente
    useEffect(() => {
        if (paginationMode === 'controlled') {
            return;
        }
        const currentLimit = searchParams.get('limit');
        if (!currentLimit) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('limit', limit.toString());
            router.replace(`?${params.toString()}`, { scroll: false });
        }
    }, [searchParams, limit, router, paginationMode]);
    const containerClasses = [
        DataGridStyles.container,
        DataGridStyles.responsive.minWidth,
        fillViewport ? 'min-h-0' : '',
        showBorder ? 'border border-border' : '',
    ]
        .filter(Boolean)
        .join(' ');
    const visibleColumns = columns.filter((c) => !c.hide);
    const computedStyles = useMemo(() => calculateColumnStyles(columns, gridWidth), [columns, gridWidth]);
    const tabLayoutFallbackExtra = fillViewport && fillViewportInTabLayout ? DATA_GRID_TAB_LAYOUT_FALLBACK_EXTRA_PX : 0;
    const containerStyle = useMemo(() => {
        if (fillViewport) {
            if (fillViewportHeightPx != null) {
                return { height: fillViewportHeightPx };
            }
            return {
                height: dataGridFillViewportFallbackHeight(viewportBottomInset, tabLayoutFallbackExtra),
            };
        }
        return {
            height: typeof height === 'number' ? `${height}px` : height,
        };
    }, [
        fillViewport,
        fillViewportHeightPx,
        height,
        viewportBottomInset,
        tabLayoutFallbackExtra,
    ]);
    return (_jsxs("div", { ref: containerRef, className: containerClasses, style: containerStyle, "data-test-id": dataTestId || "data-grid-root", children: [_jsx("div", { className: "shrink-0", children: _jsx(Header, { title: title, filterMode: filterMode, onToggleFilterMode: toggleFilterMode, columns: columns, createForm: createForm, createFormTitle: createFormTitle, onAddClick: onAddClick, addDisabled: addDisabled, addButtonVariant: addButtonVariant, addButtonLabel: addButtonLabel, screenWidth: screenWidth, onExportExcel: onExportExcel, headerActions: headerActions, showSortButton: showSortButton, showFilterButton: showFilterButton, showExportButton: showExportButton, showSearch: effectiveShowSearch, onSearchChange: onSearchChange }) }), _jsx("div", { ref: columnHeaderScrollRef, className: "shrink-0 overflow-hidden", children: _jsxs("div", { ref: columnHeaderRowRef, className: DataGridStyles.headerRow, children: [expandable && (_jsx("div", { className: `${dataGridChrome.subtleLineBottom} w-10 min-w-[40px] shrink-0 px-1`, style: {
                                height: '56px',
                                minHeight: '56px',
                                maxHeight: '56px',
                            } })), visibleColumns.map((column, i) => {
                            const style = computedStyles[i];
                            const isPinnedActionsColumn = pinActionsColumn && column.field === actionsColumnField;
                            return (_jsx(ColHeader, { column: column, computedStyle: style, filterMode: filterMode, isPinned: isPinnedActionsColumn, sortingEnabled: showSortButton }, column.field));
                        })] }) }), _jsx("div", { ref: scrollAreaRef, className: `${DataGridStyles.scrollContainer} relative`, onScroll: (e) => {
                    const headerEl = columnHeaderScrollRef.current;
                    if (headerEl) {
                        headerEl.scrollLeft = e.currentTarget.scrollLeft;
                    }
                }, children: _jsx(Body, { columns: columns, rows: loading ? [] : data, filterMode: filterMode, computedColumnStyles: computedStyles, expandable: expandable, expandedRowIds: expandedRowIds, onToggleExpand: toggleRowExpanded, expandableRowContent: expandableRowContent, pinActionsColumn: pinActionsColumn, actionsColumnField: actionsColumnField, stickyExpandedRowTopPx: expandable ? 0 : undefined, onRowClick: onRowClick, selectedRowId: selectedRowId, getRowAppearance: getRowAppearance }) }), showFooter ? (_jsx("div", { className: "shrink-0", children: _jsx(Footer, { total: total, totalGeneral: totalGeneral, paginationMode: paginationMode, page: controlledPage, limit: limit, onPaginationChange: onPaginationChange }) })) : null] }));
};
export default DataGrid;
//# sourceMappingURL=DataGrid.js.map