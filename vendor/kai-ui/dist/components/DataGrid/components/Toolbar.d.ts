import React from 'react';
import type { DataGridColumn } from '../DataGrid';
import './toolbar.css';
interface ToolbarProps {
    filterMode?: boolean;
    onToggleFilterMode?: () => void;
    columns?: DataGridColumn[];
    title?: string;
    onExportExcel?: () => Promise<void>;
    showSortButton?: boolean;
    showFilterButton?: boolean;
    showExportButton?: boolean;
}
declare const Toolbar: React.FC<ToolbarProps>;
export default Toolbar;
//# sourceMappingURL=Toolbar.d.ts.map