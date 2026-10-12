import React from 'react';
import type { DataGridAddButtonVariant } from '../DataGrid';
import type { DataGridColumn } from '../DataGrid';
interface HeaderProps {
    title?: string;
    filterMode?: boolean;
    onToggleFilterMode?: () => void;
    columns?: DataGridColumn[];
    createForm?: React.ReactNode;
    createFormTitle?: string;
    onAddClick?: () => void;
    addDisabled?: boolean;
    addButtonVariant?: DataGridAddButtonVariant;
    addButtonLabel?: string;
    screenWidth?: number;
    onExportExcel?: () => Promise<void>;
    headerActions?: React.ReactNode;
    showSortButton?: boolean;
    showFilterButton?: boolean;
    showExportButton?: boolean;
    showSearch?: boolean;
    onSearchChange?: (value: string) => void;
}
declare const Header: React.FC<HeaderProps>;
export default Header;
//# sourceMappingURL=Header.d.ts.map