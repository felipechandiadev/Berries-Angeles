"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import "./toast.css";
const ToastViewport = ({ children, className = "", }) => {
    if (!children || (Array.isArray(children) && children.length === 0)) {
        return null;
    }
    return (_jsx("div", { className: ["fs-toast-viewport", className].filter(Boolean).join(" "), "aria-label": "Notificaciones", children: children }));
};
export default ToastViewport;
//# sourceMappingURL=ToastViewport.js.map