"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import DotProgress from "../DotProgress/DotProgress";
export default function LoadingState({ className = "flex items-center justify-center py-4", size, label = "Cargando", }) {
    return (_jsx("div", { className: className, role: "status", "aria-label": label, children: _jsx(DotProgress, { size: size }) }));
}
//# sourceMappingURL=LoadingState.js.map