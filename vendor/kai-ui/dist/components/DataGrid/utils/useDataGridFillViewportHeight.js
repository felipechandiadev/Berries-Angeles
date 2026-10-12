"use client";
import { useLayoutEffect, useState } from "react";
import { DATA_GRID_TAB_LAYOUT_FALLBACK_EXTRA_PX } from "../../layouts/layoutPageTokens";
export { DATA_GRID_TAB_LAYOUT_FALLBACK_EXTRA_PX };
const MIN_GRID_HEIGHT_PX = 200;
function collectScrollParents(el) {
    const parents = [];
    let node = el.parentElement;
    while (node) {
        const { overflowY, overflow } = getComputedStyle(node);
        if (/(auto|scroll|overlay)/.test(overflowY) || /(auto|scroll|overlay)/.test(overflow)) {
            parents.push(node);
        }
        node = node.parentElement;
    }
    return parents;
}
/**
 * Altura en px para que el pie del grid quede al borde inferior del viewport.
 * Mide `top` del contenedor y resta `bottomInset` (p. ej. padding del `<main>`).
 */
export function useDataGridFillViewportHeight(enabled, containerRef, bottomInset) {
    const [heightPx, setHeightPx] = useState(null);
    useLayoutEffect(() => {
        if (!enabled) {
            setHeightPx(null);
            return;
        }
        const el = containerRef.current;
        if (!el) {
            return;
        }
        const measure = () => {
            const top = Math.max(0, Math.round(el.getBoundingClientRect().top));
            const next = Math.max(MIN_GRID_HEIGHT_PX, window.innerHeight - top - bottomInset);
            setHeightPx((prev) => (prev === next ? prev : next));
        };
        measure();
        const ro = new ResizeObserver(() => {
            requestAnimationFrame(measure);
        });
        ro.observe(el);
        const scrollParents = collectScrollParents(el);
        for (const parent of scrollParents) {
            parent.addEventListener("scroll", measure, { passive: true });
        }
        window.addEventListener("resize", measure);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", measure);
            for (const parent of scrollParents) {
                parent.removeEventListener("scroll", measure);
            }
        };
    }, [enabled, bottomInset, containerRef]);
    return enabled ? heightPx : null;
}
/** Fallback CSS mientras se mide (shell admin: topbar + padding del main). */
export function dataGridFillViewportFallbackHeight(bottomInset, extraTopInset = 0) {
    return `calc(100dvh - var(--app-topbar-height, 3.75rem) - 2.5rem - ${bottomInset + extraTopInset}px)`;
}
//# sourceMappingURL=useDataGridFillViewportHeight.js.map