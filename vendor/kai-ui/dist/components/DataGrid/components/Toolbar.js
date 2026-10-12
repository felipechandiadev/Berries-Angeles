'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import IconButton from '../../IconButton';
import { useRouter, useSearchParams } from '../../../navigation';
import './toolbar.css';
const Toolbar = ({ filterMode = false, onToggleFilterMode, columns = [], title = '', onExportExcel, showSortButton = true, showFilterButton = true, showExportButton = true, }) => {
    var _a;
    const router = useRouter();
    const searchParams = useSearchParams();
    // TODO: Implement useAlert hook
    // const { showAlert } = useAlert();
    // Determine active sort from URL
    const activeSortField = searchParams.get('sortField');
    const activeSortDir = searchParams.get('sort');
    // First visible column field
    const firstVisible = (_a = columns.find((c) => !c.hide)) === null || _a === void 0 ? void 0 : _a.field;
    const handleQuickSort = () => {
        if (!firstVisible)
            return;
        const params = new URLSearchParams(searchParams.toString());
        if (isSortActive) {
            // If already active, remove sorting params
            params.delete('sort');
            params.delete('sortField');
        }
        else {
            // Activate sort on first visible column
            params.set('sort', 'asc');
            params.set('sortField', firstVisible);
            params.set('page', '1');
        }
        router.replace(`?${params.toString()}`);
    };
    const handleExportExcel = async () => {
        if (onExportExcel) {
            try {
                await onExportExcel();
            }
            catch (error) {
                console.error('Error exporting to Excel:', error);
                // TODO: uncomment when useAlert hook is implemented
                // showAlert({ message: 'Error al exportar a Excel', type: 'error', duration: 4000 });
            }
        }
        else {
            // TODO: uncomment when useAlert hook is implemented
            // showAlert({ message: 'Exportación no disponible', type: 'warning', duration: 4000 });
        }
    };
    // UI highlight: show active when ANY sort is present
    const isSortActive = Boolean(activeSortField && activeSortDir);
    // UI highlight: show active when filter mode on OR query has filters
    const isFilterActive = filterMode || searchParams.get('filtration') === 'true' || searchParams.has('filters');
    return (_jsxs("div", { className: "flex items-center justify-end gap-2 py-0", "data-test-id": "data-grid-toolbar", children: [showSortButton && firstVisible ? (_jsx(IconButton, { variant: "action", size: "sm", title: "Ordenar por primer campo (asc)", onClick: handleQuickSort, icon: "ArrowUpDown", className: isSortActive ? 'fs-data-grid-toolbar__icon--active' : 'fs-data-grid-toolbar__icon--inactive', style: { fontSize: 20, width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } })) : null, showFilterButton ? (_jsx(IconButton, { variant: "action", size: "sm", title: filterMode ? 'Desactivar filtros' : 'Filtrar', onClick: () => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (filterMode) {
                        // Clear filters when deactivating
                        params.delete('filters');
                        params.delete('filtration');
                        router.replace(`?${params.toString()}`);
                    }
                    else {
                        // Activate filtration when enabling filter mode
                        params.set('filtration', 'true');
                        router.replace(`?${params.toString()}`);
                    }
                    onToggleFilterMode === null || onToggleFilterMode === void 0 ? void 0 : onToggleFilterMode();
                }, icon: filterMode ? 'FilterX' : 'Filter', className: isFilterActive ? 'fs-data-grid-toolbar__icon--active' : 'fs-data-grid-toolbar__icon--inactive', style: { fontSize: 20, width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } })) : null, showExportButton ? (_jsx(IconButton, { variant: "action", size: "sm", title: "Exportar a Excel", onClick: handleExportExcel, icon: "Download", className: "fs-data-grid-toolbar__icon--inactive", style: { fontSize: 20, width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } })) : null] }));
};
export default Toolbar;
//# sourceMappingURL=Toolbar.js.map