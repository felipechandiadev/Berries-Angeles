import React from 'react';
export type DataGridPaginationChange = {
    page: number;
    limit: number;
};
interface PaginationProps {
    total: number;
    totalGeneral?: number;
    mobileMode?: boolean;
    /** `url` (default): sincroniza con query string. `controlled`: usa props. */
    paginationMode?: 'url' | 'controlled';
    page?: number;
    limit?: number;
    onPaginationChange?: (next: DataGridPaginationChange) => void;
}
declare const Pagination: React.FC<PaginationProps>;
export default Pagination;
//# sourceMappingURL=Pagination.d.ts.map