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
import * as Icons from 'lucide-react';
import './icon-button.css';
const variantClassNames = {
    action: 'fs-icon-button fs-icon-button--action',
    primary: 'fs-icon-button fs-icon-button--primary',
    secondary: 'fs-icon-button fs-icon-button--secondary',
    primaryCircle: 'fs-icon-button fs-icon-button--primary-circle',
    secondaryCircle: 'fs-icon-button fs-icon-button--secondary-circle',
    neutral: 'fs-icon-button fs-icon-button--neutral',
    text: 'fs-icon-button fs-icon-button--text',
    outlined: 'fs-icon-button fs-icon-button--outlined',
};
const legacyVariantMap = {
    containedPrimary: 'primary',
    containedSecondary: 'secondary',
    basic: 'neutral',
    basicSecondary: 'action',
    ghost: 'neutral',
};
function resolveVariantClass(variant) {
    var _a;
    const key = variant !== null && variant !== void 0 ? variant : 'action';
    if (key in legacyVariantMap) {
        return variantClassNames[legacyVariantMap[key]];
    }
    return (_a = variantClassNames[key]) !== null && _a !== void 0 ? _a : variantClassNames.action;
}
const sizeMap = {
    xs: 'w-5 h-5',
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
};
const iconSizeMap = {
    xs: 16,
    sm: 18,
    md: 24,
    lg: 28,
    xl: 32,
};
const IconButton = (_a) => {
    var { icon, variant = 'action', size = 'md', strokeWidth = 2.25, disabled = false, isLoading = false, className = '', iconClassName = '', onClick, ariaLabel } = _a, props = __rest(_a, ["icon", "variant", "size", "strokeWidth", "disabled", "isLoading", "className", "iconClassName", "onClick", "ariaLabel"]);
    const sizeClass = typeof size === 'number' ? '' : sizeMap[size] || sizeMap['md'];
    const iconSize = typeof size === 'number' ? size : iconSizeMap[size] || 24;
    const effectiveDisabled = disabled || isLoading;
    const variantClass = resolveVariantClass(variant);
    const IconComponent = (isLoading ? Icons.Loader2 : Icons[icon]);
    if (!IconComponent) {
        console.warn(`Icon "${icon}" not found in lucide-react`);
        return (_jsx("button", Object.assign({ type: "button", className: `${variantClass} inline-flex items-center justify-center ${sizeClass} ${effectiveDisabled ? 'opacity-50' : ''} ${className}`, "data-test-id": "icon-button-root", onClick: onClick, "aria-label": ariaLabel, disabled: effectiveDisabled }, props, { children: _jsx("span", { className: "text-lg", children: "?" }) })));
    }
    return (_jsx("button", Object.assign({ type: "button", className: `${variantClass} inline-flex items-center justify-center ${sizeClass} ${effectiveDisabled ? 'opacity-50' : ''} ${className}`, "data-test-id": "icon-button-root", onClick: onClick, "aria-label": ariaLabel, "aria-busy": isLoading || undefined, disabled: effectiveDisabled }, props, { children: _jsx(IconComponent, { size: iconSize, strokeWidth: strokeWidth, className: `select-none ${isLoading ? 'fs-icon-button__icon--loading' : ''} ${iconClassName}`.trim(), "aria-hidden": true }) })));
};
export default IconButton;
//# sourceMappingURL=IconButton.js.map