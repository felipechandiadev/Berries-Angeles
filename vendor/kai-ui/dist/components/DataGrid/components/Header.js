'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import IconButton from '../../IconButton';
import { ButtonPill } from '../../Button';
import Toolbar from './Toolbar';
import TextField from '../../TextField';
import { useSearchParams, useRouter } from '../../../navigation';
import Dialog from '../../Dialog';
import styles from './Header.module.css';
import { flattenHeaderActions } from '../utils/flattenHeaderActions';
import { getActionSlotPositions, HEADER_GRID_COLUMNS, HEADER_GRID_TEMPLATE_COLUMNS, } from '../utils/headerGridPlacement';
function HeaderSearchField({ name, value, onChange, className = '', testId, }) {
    return (_jsx(TextField, { label: "", name: name, value: value, onChange: onChange, density: "compact", startAdornment: _jsx(Search, { className: "h-4 w-4 shrink-0 text-secondary", "aria-hidden": true }), className: className, "aria-label": "Buscar", "data-test-id": testId }));
}
const Header = ({ title, filterMode = false, onToggleFilterMode, columns = [], createForm, createFormTitle, onAddClick, addDisabled = false, addButtonVariant = 'icon', addButtonLabel, onExportExcel, headerActions, showSortButton = true, showFilterButton = true, showExportButton = true, showSearch = true, onSearchChange, }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
    React.useEffect(() => {
        setSearchInput(searchParams.get('search') || '');
    }, [searchParams]);
    const debounceTimer = React.useRef(null);
    const handleChange = useCallback((e) => {
        const value = e.target.value;
        setSearchInput(value);
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            if (onSearchChange) {
                onSearchChange(value);
            }
            else {
                const params = new URLSearchParams(searchParams.toString());
                if (value) {
                    params.set('search', value);
                }
                else {
                    params.delete('search');
                }
                params.set('page', '1');
                router.replace(`?${params.toString()}`);
            }
        }, 300);
    }, [searchParams, router, onSearchChange]);
    const showAdd = Boolean(createForm || onAddClick);
    const actionItems = useMemo(() => flattenHeaderActions(headerActions), [headerActions]);
    const fullWidthFlags = useMemo(() => actionItems.map((item) => {
        if (!React.isValidElement(item))
            return false;
        const props = item.props;
        return props["data-header-full-width"] === true;
    }), [actionItems]);
    const actionSlots = useMemo(() => getActionSlotPositions(actionItems.length, fullWidthFlags), [actionItems.length, fullWidthFlags]);
    const gridRowCount = useMemo(() => {
        if (actionSlots.length === 0) {
            return 1;
        }
        return Math.max(...actionSlots.map((slot) => slot.row));
    }, [actionSlots]);
    const openCreate = onAddClick || (() => setIsCreateModalOpen(true));
    const addTitleCell = (_jsxs("div", { className: styles.addTitleCell, "data-test-id": "data-grid-header-add-title", children: [showAdd ? (_jsx("div", { className: addButtonVariant === 'pillOutlined'
                    ? 'flex min-w-0 shrink-0 items-center overflow-visible'
                    : 'flex shrink-0 items-center', children: addButtonVariant === 'pillOutlined' ? (_jsxs(ButtonPill, { type: "button", variant: "outlined", disabled: addDisabled, onClick: openCreate, className: "!inline-flex !w-auto !max-w-none items-center gap-1.5 whitespace-nowrap", "data-test-id": "add-button-pill", "aria-label": (addButtonLabel === null || addButtonLabel === void 0 ? void 0 : addButtonLabel.trim())
                        ? `Agregar ${addButtonLabel.trim()}`
                        : 'Agregar', children: [_jsx(Plus, { className: "h-4 w-4 shrink-0 text-secondary", "aria-hidden": true }), _jsx("span", { children: (addButtonLabel === null || addButtonLabel === void 0 ? void 0 : addButtonLabel.trim()) ? addButtonLabel.trim() : 'Agregar' })] })) : (_jsx(IconButton, { icon: "Plus", variant: "action", size: "md", onClick: openCreate, disabled: addDisabled, "data-test-id": "add-button", "aria-label": "Agregar" })) })) : null, (title === null || title === void 0 ? void 0 : title.trim()) ? (_jsx("div", { className: "min-w-0 flex-1 truncate text-left text-lg font-semibold text-foreground", children: title.trim() })) : null] }));
    const renderToolbarZone = (className, searchClassName) => (_jsxs("div", { className: className, "data-test-id": "data-grid-header-toolbar-zone", children: [_jsx(Toolbar, { filterMode: filterMode, onToggleFilterMode: onToggleFilterMode, columns: columns, title: title, onExportExcel: onExportExcel, showSortButton: showSortButton, showFilterButton: showFilterButton, showExportButton: showExportButton }), showSearch ? (_jsx(HeaderSearchField, { name: "datagrid-search", value: searchInput, onChange: handleChange, className: searchClassName, testId: "data-grid-search-input" })) : null] }));
    return (_jsxs("div", { className: "w-full pb-4", "data-test-id": "data-grid-header", children: [_jsxs("div", { className: styles.desktopGrid, style: {
                    gridTemplateColumns: HEADER_GRID_TEMPLATE_COLUMNS,
                    gridTemplateRows: `repeat(${gridRowCount}, auto)`,
                }, "data-test-id": "data-grid-header-grid", children: [_jsx("div", { className: "min-w-0", style: { gridRow: 1, gridColumn: 1 }, children: addTitleCell }), _jsx("div", { className: "min-w-0", style: { gridRow: 1, gridColumn: HEADER_GRID_COLUMNS }, children: renderToolbarZone(styles.toolbarZoneDesktop, styles.searchFieldDesktop) }), actionItems.map((item, index) => {
                        const slot = actionSlots[index];
                        if (!slot) {
                            return null;
                        }
                        return (_jsx("div", { className: "flex min-w-0 items-center self-center", style: {
                                gridRow: slot.row,
                                gridColumn: slot.colSpan
                                    ? `${slot.col} / span ${slot.colSpan}`
                                    : slot.col,
                            }, "data-test-id": `header-action-slot-${index}`, children: item }, index));
                    })] }), _jsxs("div", { className: styles.mobileStack, "data-test-id": "data-grid-header-mobile", children: [addTitleCell, renderToolbarZone(styles.toolbarZoneMobile, styles.searchFieldMobile), actionItems.length > 0 ? (_jsx("div", { className: styles.mobileActions, "data-test-id": "header-actions-slot-mobile", children: actionItems.map((item, index) => (_jsx("div", { className: "min-w-0 max-w-full", children: item }, index))) })) : null] }), createForm ? (_jsx(Dialog, { open: isCreateModalOpen, onClose: () => setIsCreateModalOpen(false), size: "lg", scroll: "body", hideActions: true, title: createFormTitle, children: React.isValidElement(createForm)
                    ? React.cloneElement(createForm, {
                        onClose: () => setIsCreateModalOpen(false),
                    })
                    : createForm })) : null] }));
};
export default Header;
//# sourceMappingURL=Header.js.map