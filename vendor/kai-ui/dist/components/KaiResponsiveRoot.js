"use client";
import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from "react";
import { useBreakpoint } from "../hooks/useBreakpoint";
/**
 * Montar cerca de la raíz de la PWA (p. ej. Providers).
 * Expone el breakpoint en `document.documentElement.dataset.kaiBp`.
 */
export function KaiResponsiveRoot({ children, syncHtmlAttribute = true, }) {
    const { breakpoint } = useBreakpoint();
    useEffect(() => {
        if (!syncHtmlAttribute || typeof document === "undefined")
            return;
        document.documentElement.dataset.kaiBp = breakpoint;
        return () => {
            delete document.documentElement.dataset.kaiBp;
        };
    }, [breakpoint, syncHtmlAttribute]);
    return _jsx(_Fragment, { children: children });
}
//# sourceMappingURL=KaiResponsiveRoot.js.map