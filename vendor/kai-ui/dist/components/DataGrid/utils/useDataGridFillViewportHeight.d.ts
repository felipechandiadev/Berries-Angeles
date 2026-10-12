import { type RefObject } from "react";
import { DATA_GRID_TAB_LAYOUT_FALLBACK_EXTRA_PX } from "../../layouts/layoutPageTokens";
export { DATA_GRID_TAB_LAYOUT_FALLBACK_EXTRA_PX };
/**
 * Altura en px para que el pie del grid quede al borde inferior del viewport.
 * Mide `top` del contenedor y resta `bottomInset` (p. ej. padding del `<main>`).
 */
export declare function useDataGridFillViewportHeight(enabled: boolean, containerRef: RefObject<HTMLElement | null>, bottomInset: number): number | null;
/** Fallback CSS mientras se mide (shell admin: topbar + padding del main). */
export declare function dataGridFillViewportFallbackHeight(bottomInset: number, extraTopInset?: number): string;
//# sourceMappingURL=useDataGridFillViewportHeight.d.ts.map