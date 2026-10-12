import React from "react";
/**
 * Columnas de la grilla (mobile-first). Valores 1–12. Omite claves no definidas.
 */
export type CollectionGridColumnConfig = {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    "2xl"?: number;
};
export type CollectionPageLayoutProps = {
    /** Título principal (arriba a la izquierda). Si está vacío y no hay subtítulo, no se reserva espacio. */
    title?: string;
    /** Subtítulo bajo el título. Si está vacío, no se muestra. */
    subtitle?: string;
    /**
     * Slot de la acción “añadir” (izquierda). Pasa un componente cliente (p. ej. botón + Dialog)
     * creado en la feature. Si está definido, sustituye al `IconButton` por defecto y se ignora
     * `onAddClick` / `addButtonAriaLabel` salvo que no quieras pasar `addAction` y uses el botón genérico.
     */
    addAction?: React.ReactNode;
    /** Acción del botón + integrado (solo si no usas `addAction`). */
    onAddClick?: () => void;
    /** Etiqueta accesible del botón + por defecto (solo sin `addAction`). */
    addButtonAriaLabel?: string;
    /** Mostrar barra de búsqueda sincronizada con la URL (query). */
    showSearch?: boolean;
    /** Nombre del parámetro en la query (p. ej. `search` → `?search=...`). */
    searchParamName?: string;
    /** Etiqueta flotante del TextField de búsqueda */
    searchLabel?: string;
    searchPlaceholder?: string;
    /**
     * Contenido libre. Si `contentItems` está definido (incl. `[]`), la sección principal no usa
     * `children`: con ítems muestra grilla; con array vacío muestra vacío centrado.
     */
    children?: React.ReactNode;
    /**
     * Celdas en grilla. Si se pasa un array **vacío** (sin datos, o filtro sin coincidencias),
     * se muestra un mensaje centrado (ver `contentEmptyMessage`), no `children`.
     * Si el array tiene elementos, se renderizan en grilla; `children` se ignora.
     */
    contentItems?: React.ReactNode[];
    /**
     * Texto mostrado centrado cuando `contentItems` es `[]` (sin datos, filtro, etc.; genérico, no solo búsqueda).
     * @default "No hay nada que mostrar"
     */
    contentEmptyMessage?: string;
    /**
     * Número de columnas fijo, o desglose por breakpoint. Por defecto 1.
     * Solo aplica con `contentItems` no vacío.
     */
    contentGridColumns?: number | CollectionGridColumnConfig;
    /**
     * Clase de separación entre celdas (p. ej. `gap-4`, `gap-3 md:gap-6`). Por defecto `gap-4`.
     */
    contentGridGapClassName?: string;
    /**
     * Clases extra en el contenedor de la grilla (p. ej. alineación o `self-stretch`).
     */
    contentGridClassName?: string;
    /**
     * Alineación vertical de las celdas en la grilla. `stretch` iguala la altura de la fila
     * a la card más alta (útil con cards `fillHeight`).
     * @default 'start'
     */
    contentGridItemsAlign?: "start" | "stretch";
    className?: string;
    "data-test-id"?: string;
};
export declare function buildContentGridClassNames(cols: number | CollectionGridColumnConfig | undefined): string;
/**
 * Plantilla de página de colección/índice: cabecera alineada al DataGrid (fila `+` · título · búsqueda
 * a la derecha en `sm+`, búsqueda en fila aparte en móvil), subtítulo debajo, y búsqueda en query.
 * `addAction` sustituye el `IconButton` integrado. `contentItems` + `contentGridColumns` para la grilla.
 * Incluye `Suspense` por `useSearchParams`.
 */
export declare function CollectionPageLayout(props: CollectionPageLayoutProps): React.JSX.Element;
export default CollectionPageLayout;
//# sourceMappingURL=CollectionPageLayout.d.ts.map