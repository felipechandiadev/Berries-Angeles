import React from 'react';
import type { DataGridColumn } from '../DataGrid';
interface ColHeaderProps {
    column: DataGridColumn;
    computedStyle?: Record<string, any>;
    filterMode?: boolean;
    isPinned?: boolean;
    sortingEnabled?: boolean;
}
export declare const ColHeader: React.FC<ColHeaderProps>;
export default ColHeader;
//# sourceMappingURL=ColHeader.d.ts.map