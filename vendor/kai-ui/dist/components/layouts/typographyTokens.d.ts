/**
 * Contrato tipográfico compartido (@kai/ui).
 * Clases Tailwind reutilizables — importar en layouts, features y showcases del Design System.
 */
/** Título principal de página (h1 en layouts oficiales). */
export declare const typographyPageTitleClassName = "text-[length:var(--font-size-page-title,1.125rem)] font-semibold tracking-tight text-foreground";
/** Subtítulo bajo el h1 en layouts oficiales. */
export declare const typographyPageSubtitleClassName = "mt-1 text-sm text-muted-foreground";
/** Título de sección (h2) dentro de una vista. */
export declare const typographySectionTitleClassName = "text-[length:var(--font-size-section-title,1.25rem)] font-semibold text-foreground";
/** Título de subsección (h3), cards y paneles. */
export declare const typographySubsectionTitleClassName = "text-sm font-semibold text-foreground";
/** Cuerpo de texto estándar. */
export declare const typographyBodyClassName = "text-sm text-foreground";
/** Texto secundario, hints y metadatos. */
export declare const typographyMutedClassName = "text-sm text-muted-foreground";
/** Caption / overline (kickers, encabezados de tabla compactos). */
export declare const typographyCaptionClassName = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";
/** Código, variables CSS y snippets técnicos. */
export declare const typographyMonoClassName = "font-mono text-xs text-foreground";
/** Enlaces de navegación y acciones inline. */
export declare const typographyLinkClassName = "font-medium text-link hover:underline";
/** Números tabulares — grillas ERP, montos alineados. */
export declare const typographyTabularNumberClassName = "tabular-nums text-sm font-medium text-foreground";
/** Montos neutros (sin signo semántico). */
export declare const typographyMoneyNeutralClassName = "tabular-nums text-sm font-medium text-foreground";
/** Montos positivos (ingresos, saldos a favor). */
export declare const typographyMoneyPositiveClassName = "tabular-nums text-sm font-medium text-text-positive";
/** Montos negativos (egresos, deuda) — signo explícito en UI. */
export declare const typographyMoneyNegativeClassName = "tabular-nums text-sm font-medium text-text-negative";
/** Texto sobre fondos primary (botones, badges). */
export declare const typographyOnColorClassName = "text-text-on-primary";
/** Texto deshabilitado o no interactivo. */
export declare const typographyDisabledClassName = "text-text-disabled";
/** Label de campo de formulario. */
export declare const typographyFieldLabelClassName = "text-sm font-medium text-foreground";
/** Hint bajo campo o ayuda contextual. */
export declare const typographyFieldHintClassName = "text-xs text-muted-foreground";
/** Error de validación inline. */
export declare const typographyFieldErrorClassName = "text-xs text-text-error";
/** Confirmación inline de campo. */
export declare const typographyFieldSuccessClassName = "text-xs text-text-positive";
/** Placeholder de input. */
export declare const typographyPlaceholderClassName = "text-sm text-text-disabled";
/** Cantidad numérica (stock, unidades). */
export declare const typographyQuantityClassName = "tabular-nums text-sm font-medium text-foreground";
/** SKU / código de producto. */
export declare const typographySkuClassName = "font-mono text-xs text-muted-foreground";
/** Identificador técnico (UUID corto, folio). */
export declare const typographyIdClassName = "font-mono text-xs text-foreground";
/** Timestamp / fecha compacta. */
export declare const typographyTimestampClassName = "text-xs tabular-nums text-muted-foreground";
/** Estado success en copy. */
export declare const typographyStatusSuccessClassName = "text-sm text-text-positive";
/** Estado info en copy. */
export declare const typographyStatusInfoClassName = "text-sm text-text-info";
/** Estado warning en copy. */
export declare const typographyStatusWarningClassName = "text-sm text-text-warning";
/** Estado error en copy. */
export declare const typographyStatusErrorClassName = "text-sm text-text-error";
/** Encabezado de columna DataGrid. */
export declare const typographyTableHeaderClassName = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";
/** Celda estándar de tabla. */
export declare const typographyTableCellClassName = "text-sm text-foreground";
/** Celda secundaria / metadato en tabla. */
export declare const typographyTableCellMutedClassName = "text-sm text-muted-foreground";
/** Celda con truncado y title. */
export declare const typographyTableCellTruncateClassName = "truncate text-sm text-foreground";
/** Label touch POS. */
export declare const typographyPosTouchLabelClassName = "text-base font-medium text-foreground";
/** Valor touch POS (línea, cantidad). */
export declare const typographyPosTouchValueClassName = "text-base tabular-nums font-medium text-foreground";
/** Total touch POS (checkout). */
export declare const typographyPosTouchTotalClassName = "text-2xl font-semibold tabular-nums text-foreground";
/** Título de producto eShop. */
export declare const typographyProductTitleClassName = "text-lg font-semibold text-foreground font-display";
/** Precio listado eShop. */
export declare const typographyPriceClassName = "tabular-nums text-base font-semibold text-foreground";
/** Precio oferta eShop. */
export declare const typographySalePriceClassName = "tabular-nums text-lg font-semibold text-text-positive";
/** Precio tachado (compare-at). */
export declare const typographyCompareAtPriceClassName = "tabular-nums text-sm text-muted-foreground line-through";
/** Texto sobre fondo success. */
export declare const typographyOnSuccessClassName = "text-text-on-success";
/** Texto sobre fondo warning. */
export declare const typographyOnWarningClassName = "text-text-on-warning";
/** Texto sobre fondo error. */
export declare const typographyOnErrorClassName = "text-text-on-error";
export type TypographyScaleEntry = {
    id: string;
    name: string;
    className: string;
    sample: string;
    usage: string;
    fontFamily?: 'sans' | 'mono' | 'display';
};
/** Escala documentada para el Design System y referencia de producto. */
export declare const typographyScaleEntries: TypographyScaleEntry[];
/** Familias tipográficas del contrato (documentación / showcase). */
export declare const typographyFontFamilies: readonly [{
    readonly id: "sans";
    readonly token: "--font-sans";
    readonly label: "Sans (Inter)";
    readonly sampleClassName: "text-sm text-foreground";
    readonly sample: "Kai ERP — gestión unificada";
    readonly usage: "Cuerpo, títulos de página, UI general";
}, {
    readonly id: "mono";
    readonly token: "--font-mono";
    readonly label: "Mono";
    readonly sampleClassName: "font-mono text-xs text-foreground";
    readonly sample: "SKU-00482 · --color-primary";
    readonly usage: "Código, tokens, identificadores técnicos";
}, {
    readonly id: "display";
    readonly token: "--font-display";
    readonly label: "Display (alias sans en admin)";
    readonly sampleClassName: "text-[length:var(--font-size-section-title,1.25rem)] font-semibold text-foreground font-display";
    readonly sample: "Título display";
    readonly usage: "eShop: League Spartan; admin: alias de sans";
}];
//# sourceMappingURL=typographyTokens.d.ts.map