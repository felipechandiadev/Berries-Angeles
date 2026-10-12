"use client";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertTriangle, CheckCircle2, Info, X, XCircle, } from "lucide-react";
import "./toast.css";
const variantClass = {
    success: "fs-toast--success",
    info: "fs-toast--info",
    warning: "fs-toast--warning",
    error: "fs-toast--error",
};
const variantIcon = {
    success: CheckCircle2,
    info: Info,
    warning: AlertTriangle,
    error: XCircle,
};
const Toast = (_a) => {
    var { variant = "info", message, onClose, exiting = false, className = "", onMouseEnter, onMouseLeave } = _a, props = __rest(_a, ["variant", "message", "onClose", "exiting", "className", "onMouseEnter", "onMouseLeave"]);
    const dataTestId = props["data-test-id"];
    const Icon = variantIcon[variant];
    return (_jsxs("div", { className: [
            "fs-toast",
            variantClass[variant],
            exiting ? "fs-toast--exiting" : "fs-toast--entering",
            className,
        ]
            .filter(Boolean)
            .join(" "), role: "status", "aria-live": "polite", "data-test-id": dataTestId || `toast-${variant}`, onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave, children: [_jsx(Icon, { className: "fs-toast__icon", "aria-hidden": true, size: 20, strokeWidth: 2 }), _jsx("div", { className: "fs-toast__body", children: message }), onClose ? (_jsx("button", { type: "button", className: "fs-toast__close", "aria-label": "Cerrar notificaci\u00F3n", onClick: onClose, children: _jsx(X, { size: 16, strokeWidth: 2, "aria-hidden": true }) })) : null] }));
};
export default Toast;
//# sourceMappingURL=Toast.js.map