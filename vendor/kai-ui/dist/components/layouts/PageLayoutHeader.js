import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { layoutPageHeaderClassName, layoutPageSubtitleClassName, layoutPageTitleClassName, } from "./layoutPageTokens";
function hasChunk(node) {
    if (node == null || node === false)
        return false;
    if (typeof node === "string")
        return node.trim().length > 0;
    if (typeof node === "number")
        return true;
    return true;
}
/**
 * Encabezado compartido entre {@link BasicPageLayout} y {@link TabPageLayout}:
 * título y acciones en la misma fila; subtítulo debajo del título.
 */
export function PageLayoutHeader({ title, subtitle, headerActions, headerClassName = "", titlesTestId = "page-layout-titles", subtitleTestId = "page-layout-subtitle", headerTestId = "page-layout-header", headerRowTestId = "page-layout-header-row", headerActionsTestId = "page-layout-header-actions", }) {
    const showTitle = hasChunk(title);
    const showSubtitle = hasChunk(subtitle);
    const showHeading = showTitle || showSubtitle;
    const showActions = hasChunk(headerActions);
    if (!showHeading && !showActions) {
        return null;
    }
    const titleRow = showTitle || showActions ? (_jsxs("div", { className: "flex w-full min-w-0 items-center gap-[var(--section-gap,0.75rem)]", "data-test-id": headerRowTestId, children: [showTitle ? (_jsx("h1", { className: `${layoutPageTitleClassName} min-w-0 flex-1 truncate`, children: title })) : (_jsx("div", { className: "min-w-0 flex-1", "aria-hidden": true })), showActions ? (_jsx("div", { className: "ml-auto flex min-w-0 max-w-full flex-1 flex-wrap items-center justify-end gap-2 pb-px", "data-test-id": headerActionsTestId, children: headerActions })) : null] })) : null;
    return (_jsx("header", { className: `${layoutPageHeaderClassName} ${headerClassName}`.trim(), "data-test-id": headerTestId, children: showHeading && showActions ? (_jsxs("div", { className: "flex w-full min-w-0 flex-col gap-1", "data-test-id": titlesTestId, children: [titleRow, showSubtitle ? (_jsx("p", { className: layoutPageSubtitleClassName, "data-test-id": subtitleTestId, children: subtitle })) : null] })) : showHeading ? (_jsxs("div", { className: "min-w-0", "data-test-id": titlesTestId, children: [showTitle ? (_jsx("h1", { className: layoutPageTitleClassName, children: title })) : null, showSubtitle ? (_jsx("p", { className: layoutPageSubtitleClassName, "data-test-id": subtitleTestId, children: subtitle })) : null] })) : (_jsx("div", { className: "flex min-w-0 w-full flex-wrap justify-start pb-px", "data-test-id": headerActionsTestId, children: headerActions })) }));
}
//# sourceMappingURL=PageLayoutHeader.js.map