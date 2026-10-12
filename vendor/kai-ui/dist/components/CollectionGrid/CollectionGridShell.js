"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense } from "react";
import DotProgress from "../DotProgress/DotProgress";
import CollectionGridView from "./CollectionGrid";
function CollectionGridFallback({ title }) {
    return (_jsxs("div", { className: "flex min-h-[16rem] flex-col gap-3 rounded-md border border-border p-4", "data-test-id": "collection-grid-loading", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-10 w-10 shrink-0 animate-pulse rounded-md bg-neutral/60", "aria-hidden": true }), (title === null || title === void 0 ? void 0 : title.trim()) ? (_jsx("div", { className: "h-7 w-40 animate-pulse rounded-md bg-neutral/60", "aria-hidden": true })) : null] }), _jsx("div", { className: "flex flex-1 items-center justify-center", children: _jsx(DotProgress, { count: 3, variant: "wave" }) })] }));
}
const CollectionGrid = (props) => {
    return (_jsx(Suspense, { fallback: _jsx(CollectionGridFallback, { title: props.title }), children: _jsx(CollectionGridView, Object.assign({}, props)) }));
};
export default CollectionGrid;
//# sourceMappingURL=CollectionGridShell.js.map