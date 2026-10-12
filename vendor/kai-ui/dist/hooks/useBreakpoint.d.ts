import { type KaiBreakpoint } from "../theme/breakpoints";
export type UseBreakpointResult = {
    width: number;
    breakpoint: KaiBreakpoint;
    isXs: boolean;
    isSm: boolean;
    isMd: boolean;
    isLg: boolean;
    isXl: boolean;
    is2xl: boolean;
    atLeast: (bp: KaiBreakpoint) => boolean;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
};
/**
 * Identifica el breakpoint del viewport (Tailwind-aligned).
 * Tipografía/spacing: preferir tokens CSS en `tokens.css`.
 * Este hook: layout estructural (drawer, columnas, etc.).
 */
export declare function useBreakpoint(): UseBreakpointResult;
//# sourceMappingURL=useBreakpoint.d.ts.map