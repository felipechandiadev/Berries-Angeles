'use client';
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
import './switch.css';
const Switch = (_a) => {
    var { checked = false, onChange, label, labelPosition = 'left', optionLabels, disabled = false, density = 'default', className = '' } = _a, props = __rest(_a, ["checked", "onChange", "label", "labelPosition", "optionLabels", "disabled", "density", "className"]);
    const isCompact = density === 'compact';
    const setChecked = (next) => {
        if (disabled || next === checked) {
            return;
        }
        onChange === null || onChange === void 0 ? void 0 : onChange(next);
    };
    const toggle = () => setChecked(!checked);
    const handleKeyDown = (event) => {
        if (disabled) {
            return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggle();
        }
    };
    const labelBase = isCompact
        ? 'fs-switch__label text-foreground'
        : 'text-sm font-medium leading-normal';
    const labelMuted = isCompact ? 'fs-switch__label' : 'text-muted-foreground';
    const optionClass = (active) => {
        const tone = active ? (isCompact ? 'text-foreground' : 'text-foreground') : labelMuted;
        return [
            'fs-switch__dual-option',
            'transition-colors',
            'border-0',
            'bg-transparent',
            'p-0',
            isCompact ? '' : labelBase,
            disabled ? 'opacity-50' : '',
            tone,
            disabled ? '' : 'cursor-pointer',
        ]
            .filter(Boolean)
            .join(' ');
    };
    const thumbPrimary = Boolean(optionLabels);
    const thumbStyle = disabled
        ? {
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-neutral)',
        }
        : thumbPrimary || checked
            ? {
                borderColor: 'var(--color-primary)',
                backgroundColor: 'var(--color-primary)',
            }
            : {
                borderColor: 'var(--color-secondary)',
                backgroundColor: 'var(--color-background, #fff)',
            };
    const trackClass = [
        'fs-switch__track',
        isCompact ? 'fs-switch__track--compact' : '',
        checked ? 'fs-switch__track--checked' : '',
        disabled ? 'fs-switch__track--disabled' : '',
    ]
        .filter(Boolean)
        .join(' ');
    const track = (_jsx("span", { className: trackClass, onClick: (e) => {
            e.stopPropagation();
            toggle();
        }, role: "switch", "aria-checked": checked, "aria-disabled": disabled, tabIndex: disabled ? -1 : 0, onKeyDown: handleKeyDown, children: _jsx("span", { className: "fs-switch__thumb", style: thumbStyle }) }));
    if (optionLabels) {
        const dualClass = [
            'fs-switch__dual',
            isCompact ? 'fs-switch__dual--compact' : '',
            disabled ? 'cursor-not-allowed' : '',
            className,
        ]
            .filter(Boolean)
            .join(' ');
        return (_jsxs("div", { className: dualClass, "data-test-id": props['data-test-id'] || 'switch-dual-root', role: "group", "aria-label": `${optionLabels.off} o ${optionLabels.on}`, children: [_jsx("button", { type: "button", disabled: disabled, className: optionClass(!checked), onClick: () => setChecked(false), "aria-pressed": !checked, children: optionLabels.off }), track, _jsx("button", { type: "button", disabled: disabled, className: optionClass(checked), onClick: () => setChecked(true), "aria-pressed": checked, children: optionLabels.on })] }));
    }
    const rootClass = [
        'fs-switch__root',
        isCompact ? 'fs-switch__root--compact' : '',
        disabled ? 'fs-switch__root--disabled' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');
    return (_jsxs("label", { className: rootClass, "data-test-id": props['data-test-id'] || 'switch-root', children: [labelPosition === 'left' && label ? (_jsx("span", { className: `${labelBase} ${disabled ? 'opacity-50' : ''}`, children: label })) : null, track, labelPosition === 'right' && label ? (_jsx("span", { className: `${labelBase} ${disabled ? 'opacity-50' : ''}`, children: label })) : null] }));
};
export default Switch;
//# sourceMappingURL=Switch.js.map