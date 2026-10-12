import type { TypographyScaleEntry } from './typographyTokens';
export type TypographyRoleGroup = {
    id: string;
    title: string;
    description: string;
    entryIds: string[];
};
export type TypographyUsageRule = {
    id: string;
    category: 'hierarchy' | 'color' | 'numbers' | 'forms' | 'tables' | 'pos' | 'eshop' | 'accessibility';
    rule: string;
    do?: string;
    dont?: string;
};
export type TypographyAntipattern = {
    id: string;
    wrong: string;
    wrongClassName: string;
    right: string;
    rightClassName: string;
    why: string;
};
/** Orden de secciones en el Design System (excluye familias y ejemplos compuestos). */
export declare const typographyRoleGroups: TypographyRoleGroup[];
export declare const typographyUsageRules: TypographyUsageRule[];
export declare const typographyAntipatterns: TypographyAntipattern[];
export declare function getTypographyEntriesByGroup(entries: TypographyScaleEntry[], groupId: string): TypographyScaleEntry[];
export declare const typographyCssTokenRows: readonly [{
    readonly token: "--font-sans / --font-mono / --font-display";
    readonly usage: "Familias tipográficas";
}, {
    readonly token: "--font-weight-* / --line-height-* / --letter-spacing-*";
    readonly usage: "Pesos, interlineado y tracking";
}, {
    readonly token: "--color-text-primary / --color-text-secondary";
    readonly usage: "Texto principal y secundario";
}, {
    readonly token: "--color-text-link";
    readonly usage: "Enlaces → text-link";
}, {
    readonly token: "--color-text-disabled";
    readonly usage: "Texto no interactivo";
}, {
    readonly token: "--color-text-on-primary / on-success / on-warning / on-error";
    readonly usage: "Texto sobre fondos sólidos";
}, {
    readonly token: "--color-text-positive / negative / info / warning / error";
    readonly usage: "Estados y montos semánticos";
}];
//# sourceMappingURL=typographyRules.d.ts.map