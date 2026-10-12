import React from "react";
export declare const COLLECTION_GRID_SEARCH_DEBOUNCE_MS = 300;
export type CollectionGridHeaderProps = {
    title?: string;
    subtitle?: string;
    addAction?: React.ReactNode;
    onAddClick?: () => void;
    addButtonAriaLabel?: string;
    showSearch?: boolean;
    searchParamName?: string;
    searchLabel?: string;
    searchPlaceholder?: string;
    onSearchChange?: (value: string) => void;
    "data-test-id"?: string;
};
export declare function CollectionGridHeader({ title, subtitle, addAction, onAddClick, addButtonAriaLabel, showSearch, searchParamName, searchPlaceholder, onSearchChange, "data-test-id": dataTestId, }: CollectionGridHeaderProps): React.JSX.Element | null;
//# sourceMappingURL=CollectionGridHeader.d.ts.map