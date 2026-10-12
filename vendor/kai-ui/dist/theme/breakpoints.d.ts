/**
 * Breakpoints alineados a Tailwind default.
 * Paridad con media queries en `tokens.css`.
 */
export declare const KAI_BREAKPOINTS: {
    readonly xs: 0;
    readonly sm: 640;
    readonly md: 768;
    readonly lg: 1024;
    readonly xl: 1280;
    readonly "2xl": 1536;
};
export type KaiBreakpoint = keyof typeof KAI_BREAKPOINTS;
export declare const KAI_BREAKPOINT_ORDER: KaiBreakpoint[];
export declare function resolveKaiBreakpoint(width: number): KaiBreakpoint;
export declare function kaiBreakpointAtLeast(current: KaiBreakpoint, minimum: KaiBreakpoint): boolean;
//# sourceMappingURL=breakpoints.d.ts.map