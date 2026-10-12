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
import "./alert.css";
const variantClass = {
    success: "fs-alert--success",
    info: "fs-alert--info",
    warning: "fs-alert--warning",
    error: "fs-alert--error",
};
const Alert = (_a) => {
    var { variant = "info", children, className = "" } = _a, props = __rest(_a, ["variant", "children", "className"]);
    const dataTestId = props["data-test-id"];
    return (_jsxs("div", { className: "relative w-full", children: [_jsx("div", { className: "fs-alert__scrim", "aria-hidden": true }), _jsx("div", { className: `fs-alert ${variantClass[variant]} ${className}`.trim(), role: "alert", "data-test-id": dataTestId || `alert-${variant}`, children: children })] }));
};
export default Alert;
//# sourceMappingURL=Alert.js.map