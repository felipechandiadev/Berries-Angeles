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
import { jsx as _jsx } from "react/jsx-runtime";
import "./button.css";
const pillVariantClasses = {
    primary: "fs-pill fs-pill--primary",
    secondary: "fs-pill fs-pill--secondary",
    outlined: "fs-pill fs-pill--outlined",
};
const pillDisabledClasses = {
    primary: "fs-pill fs-pill--primary opacity-50 cursor-not-allowed",
    secondary: "fs-pill fs-pill--secondary opacity-50 cursor-not-allowed",
    outlined: "fs-pill fs-pill--outlined opacity-50 cursor-not-allowed",
};
export const ButtonPill = (_a) => {
    var { children, variant = "primary", className = "", disabled = false } = _a, props = __rest(_a, ["children", "variant", "className", "disabled"]);
    const buttonClasses = disabled
        ? `${pillDisabledClasses[variant] || pillDisabledClasses.primary} ${className}`
        : `${pillVariantClasses[variant] || pillVariantClasses.primary} ${className}`;
    return (_jsx("button", Object.assign({ className: buttonClasses, "data-test-id": "button-pill-root", disabled: disabled }, props, { children: children })));
};
//# sourceMappingURL=ButtonPill.js.map