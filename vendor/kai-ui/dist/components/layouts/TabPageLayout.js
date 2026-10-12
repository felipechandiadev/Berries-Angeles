import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageLayoutHeader } from "./PageLayoutHeader";
import { layoutPageContentClassName, layoutPageRootClassName, layoutPageRootClassNameCompact, } from "./layoutPageTokens";
/**
 * Layout de página con pestañas: comparte encabezado con {@link BasicPageLayout}
 * (raíz, título `text-lg`, subtítulo, bloque de contenido).
 *
 * Sin `"use client"` — usable en Server y Client Components (el slot `tabs` puede ser un Client Component).
 */
export function TabPageLayout({ title, subtitle, tabs, children, className = "", contentClassName = "", headerClassName = "", compact = false, "data-test-id": dataTestId, }) {
    const rootBase = compact ? layoutPageRootClassNameCompact : layoutPageRootClassName;
    return (_jsxs("div", { className: `${rootBase} ${className}`.trim(), "data-test-id": dataTestId !== null && dataTestId !== void 0 ? dataTestId : "tab-page-layout", children: [_jsx(PageLayoutHeader, { title: title, subtitle: subtitle, headerActions: tabs, headerClassName: headerClassName, titlesTestId: "tab-page-layout-titles", subtitleTestId: "tab-page-layout-subtitle", headerTestId: "tab-page-layout-header", headerRowTestId: "tab-page-layout-header-row", headerActionsTestId: "tab-page-layout-tabs" }), _jsx("section", { className: `${layoutPageContentClassName} ${contentClassName}`.trim(), "data-test-id": "tab-page-layout-content", children: children })] }));
}
//# sourceMappingURL=TabPageLayout.js.map