import type { CSSProperties } from 'react';
export type AppearanceColors = {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    accent: string;
};
export declare const DEFAULT_APPEARANCE: AppearanceColors;
export declare const APPEARANCE_COLOR_KEYS: readonly ["primary", "secondary", "background", "foreground", "accent"];
export declare function normalizeHexColor(value: string): string | null;
export declare function textOnColor(hex: string): string;
export declare function resolveAppearance(input?: Partial<AppearanceColors> | null): AppearanceColors;
export type AppearanceCssVars = Record<`--color-${string}`, string>;
export declare function buildAppearanceCssVars(colors: AppearanceColors): AppearanceCssVars;
export declare function appearanceStyle(colors: AppearanceColors): CSSProperties;
//# sourceMappingURL=appearance-theme.d.ts.map