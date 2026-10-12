"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Footer from "../DataGrid/components/Footer";
import { DataGridStyles } from "../DataGrid/utils/columnStyles";
import { DATA_GRID_TAB_LAYOUT_FALLBACK_EXTRA_PX, dataGridFillViewportFallbackHeight, useDataGridFillViewportHeight, } from "../DataGrid/utils/useDataGridFillViewportHeight";
import { CollectionGridHeader } from "./CollectionGridHeader";
import { buildContentGridClassNames, renderCollectionGridContent, } from "./collectionGridUtils";
function CollectionGridView({ title, subtitle, addAction, onAddClick, addButtonAriaLabel, showSearch = true, searchParamName = "search", searchLabel = "Buscar", searchPlaceholder = "Buscar...", onSearchChange, children, contentItems, contentEmptyMessage, contentGridColumns, contentGridGapClassName, contentGridClassName, contentGridItemsAlign, loading = false, totalRows, totalGeneral, limit = 25, showFooter = true, paginationMode = "url", page: controlledPage, onPaginationChange, height = "70vh", fillViewport = false, fillViewportInTabLayout = false, viewportBottomInset = 24, showBorder = false, className = "", "data-test-id": dataTestId, }) {
    const containerRef = useRef(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const fillViewportHeightPx = useDataGridFillViewportHeight(fillViewport, containerRef, viewportBottomInset);
    useEffect(() => {
        if (paginationMode !== "url")
            return;
        const currentLimit = searchParams.get("limit");
        if (!currentLimit) {
            const params = new URLSearchParams(searchParams.toString());
            params.set("limit", limit.toString());
            router.replace(`?${params.toString()}`, { scroll: false });
        }
    }, [searchParams, limit, router, paginationMode]);
    const containerClasses = [
        DataGridStyles.container,
        fillViewport ? "min-h-0" : "",
        showBorder ? "border border-border" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");
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
            height: typeof height === "number" ? `${height}px` : height,
        };
    }, [
        fillViewport,
        fillViewportHeightPx,
        height,
        viewportBottomInset,
        tabLayoutFallbackExtra,
    ]);
    const bodyContent = loading ? (_jsx("div", { className: "flex min-h-[12rem] w-full flex-1 items-center justify-center py-10", children: _jsx("p", { className: "text-sm text-muted-foreground", children: "Cargando\u2026" }) })) : (renderCollectionGridContent({
        contentItems,
        contentGridColumns,
        contentGridGapClassName,
        contentGridClassName,
        contentEmptyMessage,
        contentGridItemsAlign,
        children,
    }));
    return (_jsxs("div", { ref: containerRef, className: containerClasses, style: containerStyle, "data-test-id": dataTestId !== null && dataTestId !== void 0 ? dataTestId : "collection-grid-root", children: [_jsx("div", { className: "shrink-0", children: _jsx(CollectionGridHeader, { title: title, subtitle: subtitle, addAction: addAction, onAddClick: onAddClick, addButtonAriaLabel: addButtonAriaLabel, showSearch: showSearch, searchParamName: searchParamName, searchLabel: searchLabel, searchPlaceholder: searchPlaceholder, onSearchChange: onSearchChange }) }), _jsx("div", { className: `${DataGridStyles.scrollContainer} p-1`, children: bodyContent }), showFooter ? (_jsx("div", { className: "shrink-0", children: _jsx(Footer, { total: totalRows, totalGeneral: totalGeneral, paginationMode: paginationMode, page: controlledPage, limit: limit, onPaginationChange: onPaginationChange }) })) : null] }));
}
export default CollectionGridView;
export { buildContentGridClassNames };
//# sourceMappingURL=CollectionGrid.js.map