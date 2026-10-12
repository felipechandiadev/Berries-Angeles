import { jsx as _jsx } from "react/jsx-runtime";
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
export const DEFAULT_COLLECTION_EMPTY_MESSAGE = "No hay nada que mostrar";
export function renderCollectionGridContent({ contentItems, contentGridColumns, contentGridGapClassName, contentGridClassName, contentEmptyMessage, contentGridItemsAlign, children, emptyTestId = "collection-grid-empty", gridTestId = "collection-grid-body", cellTestIdPrefix = "collection-grid-cell", }) {
    if (contentItems !== undefined) {
        if (contentItems.length === 0) {
            const text = (contentEmptyMessage !== null && contentEmptyMessage !== void 0 ? contentEmptyMessage : DEFAULT_COLLECTION_EMPTY_MESSAGE).trim() ||
                DEFAULT_COLLECTION_EMPTY_MESSAGE;
            return (_jsx("div", { className: "flex min-h-[12rem] w-full min-w-0 flex-1 flex-col items-center justify-center py-10", "data-test-id": emptyTestId, children: _jsx("p", { className: "text-center text-sm text-muted-foreground", children: text }) }));
        }
        const colClass = buildContentGridClassNames(contentGridColumns !== null && contentGridColumns !== void 0 ? contentGridColumns : 1);
        const gap = (contentGridGapClassName === null || contentGridGapClassName === void 0 ? void 0 : contentGridGapClassName.trim()) || "gap-4";
        const alignClass = contentGridItemsAlign === "stretch" ? "items-stretch" : "items-start";
        const cellClass = contentGridItemsAlign === "stretch"
            ? "flex h-full min-h-0 min-w-0 flex-col"
            : "min-w-0";
        return (_jsx("div", { className: `grid w-full min-w-0 ${alignClass} ${colClass} ${gap} ${contentGridClassName !== null && contentGridClassName !== void 0 ? contentGridClassName : ""}`.trim(), "data-test-id": gridTestId, children: contentItems.map((item, i) => (_jsx("div", { className: cellClass, "data-test-id": `${cellTestIdPrefix}-${i}`, children: item }, i))) }));
    }
    return children;
}
//# sourceMappingURL=collectionGridUtils.js.map