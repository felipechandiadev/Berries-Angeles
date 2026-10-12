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
export declare function buildContentGridClassNames(cols: number | CollectionGridColumnConfig | undefined): string;
export declare const DEFAULT_COLLECTION_EMPTY_MESSAGE = "No hay nada que mostrar";
export type RenderCollectionGridContentOptions = {
    contentItems?: React.ReactNode[];
    contentGridColumns?: number | CollectionGridColumnConfig;
    contentGridGapClassName?: string;
    contentGridClassName?: string;
    contentEmptyMessage?: string;
    contentGridItemsAlign?: "start" | "stretch";
    children?: React.ReactNode;
    emptyTestId?: string;
    gridTestId?: string;
    cellTestIdPrefix?: string;
};
export declare function renderCollectionGridContent({ contentItems, contentGridColumns, contentGridGapClassName, contentGridClassName, contentEmptyMessage, contentGridItemsAlign, children, emptyTestId, gridTestId, cellTestIdPrefix, }: RenderCollectionGridContentOptions): React.ReactNode;
//# sourceMappingURL=collectionGridUtils.d.ts.map