import React from 'react';
import { type DataGridPaginationChange } from './Pagination';
interface FooterProps {
    total?: number;
    totalGeneral?: number;
    paginationMode?: 'url' | 'controlled';
    page?: number;
    limit?: number;
    onPaginationChange?: (next: DataGridPaginationChange) => void;
}
declare const Footer: React.FC<FooterProps>;
export default Footer;
//# sourceMappingURL=Footer.d.ts.map