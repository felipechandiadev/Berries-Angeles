import React from "react";
export type BasicPageLayoutProps = {
    /** Título principal (h1). */
    title?: React.ReactNode;
    /** Texto o nodo bajo el título. */
    subtitle?: React.ReactNode;
    /**
     * Botones, toggles u otros controles en la misma fila que el título (`md+`),
     * alineados a la derecha — mismo layout visual que `tabs` en {@link TabPageLayout}.
     */
    headerActions?: React.ReactNode;
    /**
     * @deprecated Usa `headerActions`.
     */
    headerEnd?: React.ReactNode;
    /** Contenido principal de la página. */
    children: React.ReactNode;
    className?: string;
    /** Clases extra en el contenedor del cuerpo (debajo del encabezado). */
    contentClassName?: string;
    /** Clases extra en el contenedor del encabezado. */
    headerClassName?: string;
    "data-test-id"?: string;
};
/**
 * Layout mínimo de página: encabezado opcional (título + subtítulo + acciones) y área de contenido.
 * Sin `"use client"` — usable en Server y Client Components.
 */
export declare function BasicPageLayout({ title, subtitle, headerActions, headerEnd, children, className, contentClassName, headerClassName, "data-test-id": dataTestId, }: BasicPageLayoutProps): React.JSX.Element;
//# sourceMappingURL=BasicPageLayout.d.ts.map