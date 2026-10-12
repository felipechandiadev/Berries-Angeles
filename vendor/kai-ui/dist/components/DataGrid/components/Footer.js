'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Pagination from './Pagination';
import { useScreenSize } from '../utils/columnStyles';
import dataGridChrome from '../dataGridChrome.module.css';
import { Select } from '../../Select';
import { useSearchParams, useRouter } from '../../../navigation';
const Footer = ({ total = 0, totalGeneral, paginationMode = 'url', page: controlledPage, limit: controlledLimit, onPaginationChange, }) => {
    const { isMobile } = useScreenSize();
    const searchParams = useSearchParams();
    const router = useRouter();
    const page = paginationMode === 'controlled'
        ? Math.max(1, controlledPage !== null && controlledPage !== void 0 ? controlledPage : 1)
        : parseInt(searchParams.get('page') || '1', 10);
    const limit = paginationMode === 'controlled'
        ? Math.max(1, controlledLimit !== null && controlledLimit !== void 0 ? controlledLimit : 25)
        : parseInt(searchParams.get('limit') || '25', 10);
    const updateSearchParams = (newParams) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(newParams).forEach(([key, value]) => {
            params.set(key, value);
        });
        router.push(`?${params.toString()}`);
    };
    const handleLimitChange = (newLimit) => {
        if (paginationMode === 'controlled') {
            onPaginationChange === null || onPaginationChange === void 0 ? void 0 : onPaginationChange({ page: 1, limit: newLimit });
            return;
        }
        updateSearchParams({ limit: newLimit.toString(), page: '1' });
    };
    const paginationProps = {
        total,
        totalGeneral,
        paginationMode,
        page: controlledPage,
        limit: controlledLimit,
        onPaginationChange,
    };
    const limitOptions = [
        { id: '5', label: '5' },
        { id: '10', label: '10' },
        { id: '25', label: '25' },
        { id: '50', label: '50' },
        { id: '75', label: '75' },
        { id: '100', label: '100' },
        { id: '200', label: '200' },
        { id: '300', label: '300' },
        { id: '500', label: '500' }
    ];
    if (isMobile) {
        return (_jsxs("div", { className: `flex min-h-0 flex-col gap-2 p-0 py-2 ${dataGridChrome.subtleLineTop}`, "data-test-id": "data-grid-footer", children: [_jsx("div", { className: "flex justify-center", children: _jsx(Pagination, Object.assign({}, paginationProps, { mobileMode: true })) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3 flex-shrink-0", children: [_jsx("span", { className: "text-xs text-foreground whitespace-nowrap", children: "Filas por p\u00E1gina:" }), _jsx(Select, { options: limitOptions, placeholder: "", value: limit, onChange: (newLimit) => newLimit && handleLimitChange(Number(newLimit)), variant: "minimal", className: "min-w-[112px]" })] }), _jsx("div", { className: "text-xs text-muted-foreground", children: totalGeneral && totalGeneral !== total ? `Filtrados: ${total} de ${totalGeneral}` : `Total: ${total}` })] })] }));
    }
    return (_jsx("div", { className: `p-0 ${dataGridChrome.subtleLineTop}`, "data-test-id": "data-grid-footer", children: _jsx(Pagination, Object.assign({}, paginationProps)) }));
};
export default Footer;
//# sourceMappingURL=Footer.js.map