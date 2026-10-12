"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSearchParams, useRouter } from '../../../navigation';
import IconButton from '../../IconButton';
import { Select } from '../../Select';
const Pagination = ({ total, totalGeneral, mobileMode = false, paginationMode = 'url', page: controlledPage, limit: controlledLimit, onPaginationChange, }) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const page = paginationMode === 'controlled'
        ? Math.max(1, controlledPage !== null && controlledPage !== void 0 ? controlledPage : 1)
        : parseInt(searchParams.get('page') || '1', 10);
    const limit = paginationMode === 'controlled'
        ? Math.max(1, controlledLimit !== null && controlledLimit !== void 0 ? controlledLimit : 25)
        : parseInt(searchParams.get('limit') || '25', 10);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    // Funciones para actualizar la URL
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
        updateSearchParams({ limit: newLimit.toString(), page: '1' }); // Reset to page 1 when changing limit
    };
    const handlePageChange = (newPage) => {
        if (paginationMode === 'controlled') {
            onPaginationChange === null || onPaginationChange === void 0 ? void 0 : onPaginationChange({ page: newPage, limit });
            return;
        }
        updateSearchParams({ page: newPage.toString() });
    };
    // Opciones fijas para el paginador
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
    if (mobileMode) {
        return (_jsxs("div", { className: "flex items-center gap-2 text-xs text-foreground", "data-test-id": "data-grid-pagination", children: [_jsx(IconButton, { icon: "ChevronsLeft", variant: "action", size: "sm", className: "p-1 cursor-pointer", onClick: () => handlePageChange(1), "aria-label": "Primera p\u00E1gina" }), _jsx(IconButton, { icon: "ChevronLeft", variant: "action", size: "sm", className: "p-1 cursor-pointer", onClick: () => handlePageChange(Math.max(1, page - 1)), "aria-label": "Anterior" }), _jsxs("div", { className: "px-3 py-1 text-xs font-normal text-foreground w-16 text-center", children: [page, " ", _jsxs("span", { className: "text-muted-foreground", children: ["/ ", totalPages] })] }), _jsx(IconButton, { icon: "ChevronRight", variant: "action", size: "sm", className: "p-1 cursor-pointer", onClick: () => handlePageChange(Math.min(totalPages, page + 1)), "aria-label": "Siguiente" }), _jsx(IconButton, { icon: "ChevronsRight", variant: "action", size: "sm", className: "p-1 cursor-pointer", onClick: () => handlePageChange(totalPages), "aria-label": "\u00DAltima p\u00E1gina" })] }));
    }
    return (_jsxs("div", { className: "flex items-center justify-between px-0 py-1", "data-test-id": "data-grid-pagination", children: [_jsxs("div", { className: "flex items-center gap-3 flex-shrink-0", children: [_jsx("span", { className: "text-xs text-foreground font-normal whitespace-nowrap", children: "Filas por p\u00E1gina:" }), _jsx(Select, { options: limitOptions, placeholder: "", value: limit, onChange: (newLimit) => newLimit && handleLimitChange(Number(newLimit)), variant: "minimal", className: "min-w-[112px]" })] }), _jsx("div", { className: "flex-1 text-center", children: _jsx("div", { className: "text-xs text-muted-foreground", children: totalGeneral && totalGeneral !== total ? `Registros filtrados: ${total} de ${totalGeneral}` : `Registros totales: ${total}` }) }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-foreground", children: [_jsx(IconButton, { icon: "ChevronsLeft", variant: "action", size: "sm", className: "p-1 cursor-pointer", onClick: () => handlePageChange(1), "aria-label": "Primera p\u00E1gina" }), _jsx(IconButton, { icon: "ChevronLeft", variant: "action", size: "sm", className: "p-1 cursor-pointer", onClick: () => handlePageChange(Math.max(1, page - 1)), "aria-label": "Anterior" }), _jsxs("div", { className: "px-3 py-1 text-xs font-normal text-foreground w-16 text-center", children: [page, " ", _jsxs("span", { className: "text-muted-foreground", children: ["/ ", totalPages] })] }), _jsx(IconButton, { icon: "ChevronRight", variant: "action", size: "sm", className: "p-1 cursor-pointer", onClick: () => handlePageChange(Math.min(totalPages, page + 1)), "aria-label": "Siguiente" }), _jsx(IconButton, { icon: "ChevronsRight", variant: "action", size: "sm", className: "p-1 cursor-pointer", onClick: () => handlePageChange(totalPages), "aria-label": "\u00DAltima p\u00E1gina" })] })] }));
};
export default Pagination;
//# sourceMappingURL=Pagination.js.map