"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "../../navigation";
import { Search } from "lucide-react";
import TextField from "../TextField";
import IconButton from "../IconButton";
import { layoutPageContentClassName, layoutPageHeaderClassName, layoutPageRootClassName, layoutPageSubtitleClassName, layoutPageTitleClassName, } from "./layoutPageTokens";
const SEARCH_DEBOUNCE_MS = 300;
/** Mapeo explícito para el scanner de Tailwind (evitar clases dinámicas). */
const GRID_COLS = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
    9: "grid-cols-9",
    10: "grid-cols-10",
    11: "grid-cols-11",
    12: "grid-cols-12",
};
function clampGridCols(n) {
    if (Number.isNaN(n))
        return 1;
    return Math.min(12, Math.max(1, Math.round(n)));
}
function gridColToken(n) {
    var _a;
    return (_a = GRID_COLS[clampGridCols(n)]) !== null && _a !== void 0 ? _a : "grid-cols-1";
}
export function buildContentGridClassNames(cols) {
    if (cols == null) {
        return "grid-cols-1";
    }
    if (typeof cols === "number") {
        return gridColToken(cols);
    }
    const parts = [];
    parts.push(cols.default != null ? gridColToken(cols.default) : "grid-cols-1");
    if (cols.sm != null)
        parts.push(`sm:${gridColToken(cols.sm)}`);
    if (cols.md != null)
        parts.push(`md:${gridColToken(cols.md)}`);
    if (cols.lg != null)
        parts.push(`lg:${gridColToken(cols.lg)}`);
    if (cols.xl != null)
        parts.push(`xl:${gridColToken(cols.xl)}`);
    if (cols["2xl"] != null)
        parts.push(`2xl:${gridColToken(cols["2xl"])}`);
    return parts.join(" ");
}
const DEFAULT_CONTENT_EMPTY_MESSAGE = "No hay nada que mostrar";
function renderContentSection(contentItems, contentGridColumns, contentGridGapClassName, contentGridClassName, contentEmptyMessage, contentGridItemsAlign, children) {
    if (contentItems !== undefined) {
        if (contentItems.length === 0) {
            const text = (contentEmptyMessage !== null && contentEmptyMessage !== void 0 ? contentEmptyMessage : DEFAULT_CONTENT_EMPTY_MESSAGE).trim() || DEFAULT_CONTENT_EMPTY_MESSAGE;
            return (_jsx("div", { className: "flex min-h-[12rem] w-full min-w-0 flex-1 flex-col items-center justify-center py-10", "data-test-id": "collection-page-layout-empty", children: _jsx("p", { className: "text-center text-sm text-muted-foreground", children: text }) }));
        }
        const colClass = buildContentGridClassNames(contentGridColumns !== null && contentGridColumns !== void 0 ? contentGridColumns : 1);
        const gap = (contentGridGapClassName === null || contentGridGapClassName === void 0 ? void 0 : contentGridGapClassName.trim()) || "gap-4";
        const alignClass = contentGridItemsAlign === "stretch" ? "items-stretch" : "items-start";
        const cellClass = contentGridItemsAlign === "stretch"
            ? "flex h-full min-h-0 min-w-0 flex-col"
            : "min-w-0";
        return (_jsx("div", { className: `grid w-full min-w-0 ${alignClass} ${colClass} ${gap} ${contentGridClassName !== null && contentGridClassName !== void 0 ? contentGridClassName : ""}`.trim(), "data-test-id": "collection-page-layout-grid", children: contentItems.map((item, i) => (_jsx("div", { className: cellClass, "data-test-id": `collection-page-layout-cell-${i}`, children: item }, i))) }));
    }
    return children;
}
function CollectionPageLayoutView({ title, subtitle, addAction, onAddClick, addButtonAriaLabel = "Añadir", showSearch = true, searchParamName = "search", searchLabel = "Buscar", searchPlaceholder = "", children, contentItems, contentGridColumns, contentGridGapClassName, contentGridClassName, contentEmptyMessage, contentGridItemsAlign, className = "", "data-test-id": dataTestId, }) {
    var _a, _b, _c;
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const paramValue = (_a = searchParams.get(searchParamName)) !== null && _a !== void 0 ? _a : "";
    const [searchInput, setSearchInput] = useState(paramValue);
    const debounceRef = useRef(null);
    useEffect(() => {
        setSearchInput(paramValue);
    }, [paramValue]);
    const pushQuery = useCallback((value) => {
        const next = new URLSearchParams(searchParams.toString());
        const trimmed = value.trim();
        if (trimmed) {
            next.set(searchParamName, trimmed);
        }
        else {
            next.delete(searchParamName);
        }
        const qs = next.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, [pathname, router, searchParamName, searchParams]);
    const handleSearchChange = (e) => {
        const v = e.target.value;
        setSearchInput(v);
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            pushQuery(v);
            debounceRef.current = null;
        }, SEARCH_DEBOUNCE_MS);
    };
    const titleTrim = (_b = title === null || title === void 0 ? void 0 : title.trim()) !== null && _b !== void 0 ? _b : "";
    const subtitleTrim = (_c = subtitle === null || subtitle === void 0 ? void 0 : subtitle.trim()) !== null && _c !== void 0 ? _c : "";
    const hasCustomAdd = addAction !== undefined;
    const hasDefaultAdd = !hasCustomAdd && onAddClick != null;
    const hasAddSlot = hasCustomAdd || hasDefaultAdd;
    /** Misma idea que el header del DataGrid: fila con +, título y búsqueda (desktop). */
    const showTitleRow = hasAddSlot || Boolean(titleTrim) || showSearch;
    const showSubtitle = Boolean(subtitleTrim);
    const showHeaderBlock = showTitleRow || showSubtitle;
    return (_jsxs("div", { className: `${layoutPageRootClassName} ${className}`.trim(), "data-test-id": dataTestId !== null && dataTestId !== void 0 ? dataTestId : "collection-page-layout-root", children: [showHeaderBlock ? (_jsxs("header", { className: layoutPageHeaderClassName, "data-test-id": "collection-page-layout-header", children: [showTitleRow ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex w-full items-center gap-2 py-0", children: [hasAddSlot ? (_jsx("div", { className: "flex shrink-0 items-center", "data-test-id": "collection-page-layout-add-wrap", children: hasCustomAdd ? (addAction) : hasDefaultAdd ? (_jsx(IconButton, { icon: "Plus", variant: "action", size: "md", ariaLabel: addButtonAriaLabel, onClick: onAddClick, "data-test-id": "collection-page-layout-add" })) : null })) : null, titleTrim ? (_jsx("h1", { className: `whitespace-nowrap ${layoutPageTitleClassName}`, children: titleTrim })) : null, _jsx("div", { className: "min-w-0 flex-1", "aria-hidden": true }), showSearch ? (_jsx("div", { className: "hidden items-center gap-2 sm:flex", children: _jsx(TextField, { label: searchLabel, name: searchParamName, value: searchInput, onChange: handleSearchChange, placeholder: searchPlaceholder, startAdornment: _jsx(Search, { className: "h-4 w-4 shrink-0 text-secondary", "aria-hidden": true }), className: "w-full sm:w-64", "data-test-id": "collection-page-layout-search" }) })) : null] }), showSearch ? (_jsx("div", { className: "mt-0 flex items-start justify-end gap-2 sm:hidden", children: _jsx("div", { className: "flex min-w-0 max-w-xs flex-1 items-start", children: _jsxs("div", { className: "flex w-full items-start gap-2", children: [_jsx("label", { htmlFor: `${searchParamName}-mobile`, className: "sr-only", children: searchLabel }), _jsx(TextField, { label: "Buscar", placeholder: searchPlaceholder, name: `${searchParamName}-mobile`, value: searchInput, onChange: handleSearchChange, startAdornment: _jsx(Search, { className: "h-4 w-4 shrink-0 text-secondary", "aria-hidden": true }), className: "w-full text-sm", "data-test-id": "collection-page-layout-search-mobile" })] }) }) })) : null] })) : null, showSubtitle ? (_jsx("p", { className: layoutPageSubtitleClassName, children: subtitleTrim })) : null] })) : null, _jsx("section", { className: layoutPageContentClassName, "data-test-id": "collection-page-layout-content", children: renderContentSection(contentItems, contentGridColumns, contentGridGapClassName, contentGridClassName, contentEmptyMessage, contentGridItemsAlign, children) })] }));
}
function CollectionPageLayoutFallback({ title, subtitle, addAction, onAddClick, showSearch = true, children, contentItems, contentGridColumns, contentGridGapClassName, contentGridClassName, contentEmptyMessage, contentGridItemsAlign, className, }) {
    var _a, _b;
    const titleTrim = (_a = title === null || title === void 0 ? void 0 : title.trim()) !== null && _a !== void 0 ? _a : "";
    const subtitleTrim = (_b = subtitle === null || subtitle === void 0 ? void 0 : subtitle.trim()) !== null && _b !== void 0 ? _b : "";
    const hasContentItems = contentItems != null;
    const hasGrid = hasContentItems && contentItems.length > 0;
    const isContentEmpty = hasContentItems && contentItems.length === 0;
    const hasCustomAdd = addAction !== undefined;
    const hasDefaultAdd = !hasCustomAdd && onAddClick != null;
    const hasAddSlot = hasCustomAdd || hasDefaultAdd;
    const showTitleRow = hasAddSlot || Boolean(titleTrim) || showSearch;
    const showSubtitle = Boolean(subtitleTrim);
    const showHeaderBlock = showTitleRow || showSubtitle;
    const emptyText = (contentEmptyMessage !== null && contentEmptyMessage !== void 0 ? contentEmptyMessage : DEFAULT_CONTENT_EMPTY_MESSAGE).trim() || DEFAULT_CONTENT_EMPTY_MESSAGE;
    const fallbackAlignClass = contentGridItemsAlign === "stretch" ? "items-stretch" : "items-start";
    return (_jsxs("div", { className: `${layoutPageRootClassName} ${className !== null && className !== void 0 ? className : ""}`.trim(), children: [showHeaderBlock ? (_jsxs("header", { className: layoutPageHeaderClassName, "data-test-id": "collection-page-layout-header", children: [showTitleRow ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex w-full items-center gap-2 py-0", children: [hasAddSlot ? (_jsx("div", { className: "h-10 w-10 shrink-0 animate-pulse rounded-md bg-neutral/60", "aria-hidden": true, "data-test-id": "collection-page-layout-add-skeleton" })) : null, titleTrim ? (_jsx("div", { className: "h-7 w-40 max-w-[60%] shrink-0 animate-pulse rounded-md bg-neutral/60", "aria-hidden": true })) : null, _jsx("div", { className: "min-w-0 flex-1", "aria-hidden": true }), showSearch ? (_jsx("div", { className: "hidden h-10 w-64 max-w-[40%] shrink-0 animate-pulse rounded-md bg-neutral/60 sm:block", "aria-hidden": true })) : null] }), showSearch ? (_jsx("div", { className: "mt-1 h-10 w-full max-w-xs animate-pulse rounded-md bg-neutral/60 sm:hidden", "aria-hidden": true })) : null] })) : null, showSubtitle ? (_jsx("div", { className: "mt-2 h-4 w-72 max-w-full animate-pulse rounded-md bg-neutral/60", "aria-hidden": true })) : null] })) : null, _jsx("section", { className: layoutPageContentClassName, children: hasGrid && contentItems ? (_jsx("div", { className: `grid w-full min-w-0 ${fallbackAlignClass} ${buildContentGridClassNames(contentGridColumns !== null && contentGridColumns !== void 0 ? contentGridColumns : 1)} ${(contentGridGapClassName === null || contentGridGapClassName === void 0 ? void 0 : contentGridGapClassName.trim()) || "gap-4"} ${contentGridClassName !== null && contentGridClassName !== void 0 ? contentGridClassName : ""}`.trim(), children: contentItems.map((_, i) => (_jsx("div", { className: "h-32 min-w-0 animate-pulse rounded-md bg-neutral/60", "aria-hidden": true, "data-test-id": `collection-page-layout-cell-skeleton-${i}` }, i))) })) : isContentEmpty ? (_jsx("div", { className: "flex min-h-[12rem] w-full min-w-0 flex-col items-center justify-center py-10", "data-test-id": "collection-page-layout-empty", children: _jsx("p", { className: "text-center text-sm text-muted-foreground", children: emptyText }) })) : (children) })] }));
}
/**
 * Plantilla de página de colección/índice: cabecera alineada al DataGrid (fila `+` · título · búsqueda
 * a la derecha en `sm+`, búsqueda en fila aparte en móvil), subtítulo debajo, y búsqueda en query.
 * `addAction` sustituye el `IconButton` integrado. `contentItems` + `contentGridColumns` para la grilla.
 * Incluye `Suspense` por `useSearchParams`.
 */
export function CollectionPageLayout(props) {
    return (_jsx(Suspense, { fallback: _jsx(CollectionPageLayoutFallback, Object.assign({}, props)), children: _jsx(CollectionPageLayoutView, Object.assign({}, props)) }));
}
export default CollectionPageLayout;
//# sourceMappingURL=CollectionPageLayout.js.map