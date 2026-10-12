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
import { createContext, useContext } from "react";
import { Button } from "./Button";
const ButtonGroupContext = createContext(null);
export function ButtonGroup({ children, className = "", variant = "outlined", size, density = "default", "data-test-id": dataTestId = "button-group", "aria-label": ariaLabel, }) {
    const resolvedSize = size !== null && size !== void 0 ? size : (density === "compact" ? "sm" : "md");
    return (_jsx(ButtonGroupContext.Provider, { value: { size: resolvedSize, variant, density }, children: _jsx("div", { role: "group", "aria-label": ariaLabel, className: `fs-button-group${density === "compact" ? " fs-button-group--compact" : ""} ${className}`.trim(), "data-test-id": dataTestId, children: children }) }));
}
export function ButtonGroupItem(_a) {
    var _b, _c, _d;
    var { selected = false, variant, size, className = "" } = _a, props = __rest(_a, ["selected", "variant", "size", "className"]);
    const ctx = useContext(ButtonGroupContext);
    const resolvedVariant = (_b = variant !== null && variant !== void 0 ? variant : ctx === null || ctx === void 0 ? void 0 : ctx.variant) !== null && _b !== void 0 ? _b : "outlined";
    const resolvedSize = (_c = size !== null && size !== void 0 ? size : ctx === null || ctx === void 0 ? void 0 : ctx.size) !== null && _c !== void 0 ? _c : "md";
    return (_jsx(Button, Object.assign({}, props, { variant: selected ? "primary" : resolvedVariant, size: resolvedSize, "aria-pressed": selected ? true : undefined, className: `fs-button-group__item${selected ? " fs-button-group__item--selected" : ""} ${className}`.trim(), "data-test-id": (_d = props["data-test-id"]) !== null && _d !== void 0 ? _d : "button-group-item" })));
}
/** Grupo de selección única (toggle) sobre `ButtonGroupItem`. */
export function ButtonGroupToggle({ value, onChange, options, className, variant = "outlined", size, density = "default", "data-test-id": dataTestId = "button-group-toggle", "aria-label": ariaLabel, }) {
    return (_jsx(ButtonGroup, { className: className, variant: variant, size: size, density: density, "data-test-id": dataTestId, "aria-label": ariaLabel, children: options.map((opt) => (_jsx(ButtonGroupItem, { type: "button", selected: value === opt.id, disabled: opt.disabled, onClick: () => onChange(opt.id), "data-test-id": `${dataTestId}-${opt.id}`, children: opt.label }, opt.id))) }));
}
//# sourceMappingURL=ButtonGroup.js.map