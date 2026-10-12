/** Reserva para fila de pestañas en fallback CSS (`fillViewportInTabLayout`). */
export declare const DATA_GRID_TAB_LAYOUT_FALLBACK_EXTRA_PX = 52;
/**
 * Clases compartidas entre {@link BasicPageLayout}, {@link TabPageLayout} y {@link CollectionPageLayout}
 * para raíz, cabecera, título, subtítulo y contenido principal.
 *
 * Sin padding/margen exterior: el inset lo define solo el `<main>` del app shell
 * (`px-6 pb-6 md:px-10`). Usar `gap-*` entre bloques internos, no `p-*`/`m-*` en la raíz.
 */
export declare const layoutPageRootClassName = "flex w-full min-w-0 max-w-full flex-col gap-[var(--page-gap,1rem)]";
/** Misma raíz que {@link layoutPageRootClassName} con menos espacio entre cabecera y contenido (p. ej. pestañas). */
export declare const layoutPageRootClassNameCompact = "flex w-full min-w-0 max-w-full flex-col gap-[var(--section-gap,0.5rem)]";
/** Bloque de cabecera (título / subtítulo / toolbar). */
export declare const layoutPageHeaderClassName = "w-full min-w-0";
/** Título principal (h1). En Collection la fila compacta añade `whitespace-nowrap`. */
export declare const layoutPageTitleClassName = "text-[length:var(--font-size-page-title,1.125rem)] font-semibold tracking-tight text-foreground";
export declare const layoutPageSubtitleClassName = "mt-1 text-sm text-muted-foreground";
/** Contenedor principal bajo la cabecera (scroll / flex en página). */
export declare const layoutPageContentClassName = "min-h-0 min-w-0 w-full max-w-full flex-1";
/**
 * Alto útil bajo el TopBar y el padding del `<main>` del shell admin
 * (`pt-[calc(var(--app-topbar-height)+1rem)]`, `pb-6`).
 */
export declare const adminFillViewportBelowTopBarClassName = "h-[calc(100dvh-var(--app-topbar-height,3.75rem)-2.5rem)] min-h-[calc(100dvh-var(--app-topbar-height,3.75rem)-2.5rem)]";
/** Alias documentado; ver {@link DATA_GRID_TAB_LAYOUT_FALLBACK_EXTRA_PX}. */
export declare const LAYOUT_TAB_PAGE_FALLBACK_VIEWPORT_EXTRA_PX = 52;
/** Props recomendadas para `DataGrid` dentro de `TabPageLayout` (ventas, compras, DTE, etc.). */
export declare const dataGridFillViewportTabPageProps: {
    readonly fillViewport: true;
    readonly fillViewportInTabLayout: true;
};
//# sourceMappingURL=layoutPageTokens.d.ts.map