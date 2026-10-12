import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageLayoutHeader } from "./PageLayoutHeader";
import { layoutPageContentClassName, layoutPageRootClassName, } from "./layoutPageTokens";
/**
 * Layout mínimo de página: encabezado opcional (título + subtítulo + acciones) y área de contenido.
 * Sin `"use client"` — usable en Server y Client Components.
 */
export function BasicPageLayout({ title, subtitle, headerActions, headerEnd, children, className = "", contentClassName = "", headerClassName = "", "data-test-id": dataTestId, }) {
    const actions = headerActions !== null && headerActions !== void 0 ? headerActions : headerEnd;
    return (_jsxs("div", { className: `${layoutPageRootClassName} ${className}`.trim(), "data-test-id": dataTestId !== null && dataTestId !== void 0 ? dataTestId : "basic-page-layout", children: [_jsx(PageLayoutHeader, { title: title, subtitle: subtitle, headerActions: actions, headerClassName: headerClassName, titlesTestId: "basic-page-layout-titles", subtitleTestId: "basic-page-layout-subtitle", headerTestId: "basic-page-layout-header", headerRowTestId: "basic-page-layout-header-row", headerActionsTestId: "basic-page-layout-header-actions" }), _jsx("section", { className: `${layoutPageContentClassName} ${contentClassName}`.trim(), "data-test-id": "basic-page-layout-content", children: children })] }));
}
//# sourceMappingURL=BasicPageLayout.js.map