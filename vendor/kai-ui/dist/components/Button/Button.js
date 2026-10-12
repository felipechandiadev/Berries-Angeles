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
import DotProgress from "../DotProgress/DotProgress";
import "./button.css";
const variantClasses = {
    primary: "fs-button fs-button--contained-primary",
    secondary: "fs-button fs-button--contained-secondary",
    outlined: "fs-button fs-button--outlined",
    outlinedSecondary: "fs-button fs-button--outlined-secondary",
    text: "fs-button fs-button--text",
    danger: "fs-button fs-button--contained-danger",
};
const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 fs-button--size-md",
    lg: "px-6 py-3 text-lg",
};
const disabledClasses = {
    primary: "fs-button fs-button--contained-primary opacity-50 cursor-not-allowed",
    secondary: "fs-button fs-button--contained-secondary opacity-50 cursor-not-allowed",
    outlined: "fs-button fs-button--outlined opacity-50 cursor-not-allowed",
    outlinedSecondary: "fs-button fs-button--outlined-secondary opacity-50 cursor-not-allowed",
    text: "fs-button fs-button--text opacity-50 cursor-not-allowed",
    danger: "fs-button fs-button--contained-danger opacity-50 cursor-not-allowed",
};
export const Button = (_a) => {
    var { children, variant = "primary", size = "md", className = "", disabled = false, loading = false } = _a, props = __rest(_a, ["children", "variant", "size", "className", "disabled", "loading"]);
    const baseClasses = (disabled || loading)
        ? (disabledClasses[variant] || disabledClasses.primary)
        : (variantClasses[variant] || variantClasses.primary);
    const sizeClass = sizeClasses[size] || sizeClasses.md;
    const buttonClasses = `${baseClasses} ${sizeClass} ${className}`;
    // Filter out non-HTML button attributes
    const { color, fullWidth } = props, buttonProps = __rest(props, ["color", "fullWidth"]);
    return (_jsx("button", Object.assign({ className: buttonClasses, "data-test-id": "button-root", disabled: disabled || loading, "aria-busy": loading || undefined }, buttonProps, { children: _jsx("div", { className: "flex items-center justify-center gap-2 min-h-[1.25rem]", children: loading ? (_jsx(DotProgress, { variant: "wave", count: 3, size: 6, gap: 3, colorPrimary: "currentColor", colorNeutral: "currentColor", className: "fs-button__loading-dots" })) : (children) }) })));
};
//# sourceMappingURL=Button.js.map