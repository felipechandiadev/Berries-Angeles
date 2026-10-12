'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import DotProgress from '../DotProgress/DotProgress';
// Importar DataGrid dinámicamente para evitar SSR y hydration mismatches
const DataGrid = dynamic(() => import('./DataGrid'), {
    ssr: false,
    loading: () => _jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(DotProgress, {}) })
});
const DataGridWrapper = (props) => {
    return (_jsx(Suspense, { fallback: _jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(DotProgress, {}) }), children: _jsx(DataGrid, Object.assign({}, props)) }));
};
export default DataGridWrapper;
//# sourceMappingURL=DataGridWrapper.js.map