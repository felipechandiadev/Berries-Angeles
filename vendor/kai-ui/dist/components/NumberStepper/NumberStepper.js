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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import './number-stepper.css';
export const NumberStepper = (_a) => {
    var { label, icon, iconPosition = 'above', value, onChange, step = 1, min, max, required = false, allowNegative = true, allowFloat = false, placeholder, className = "", disabled = false } = _a, props = __rest(_a, ["label", "icon", "iconPosition", "value", "onChange", "step", "min", "max", "required", "allowNegative", "allowFloat", "placeholder", "className", "disabled"]);
    const inputRef = useRef(null);
    const displayValue = Number.isFinite(value) ? value : 0;
    // Función para validar y formatear el valor
    const validateAndFormatValue = (newValue) => {
        let validatedValue = newValue;
        // Aplicar límites
        if (min !== undefined && validatedValue < min) {
            validatedValue = min;
        }
        if (max !== undefined && validatedValue > max) {
            validatedValue = max;
        }
        // No permitir negativos si no está permitido
        if (!allowNegative && validatedValue < 0) {
            validatedValue = 0;
        }
        // Redondear si no se permiten floats
        if (!allowFloat) {
            validatedValue = Math.round(validatedValue);
        }
        return validatedValue;
    };
    // Función para incrementar
    const increment = () => {
        if (disabled)
            return;
        const newValue = value + step;
        const validatedValue = validateAndFormatValue(newValue);
        onChange(validatedValue);
    };
    // Función para decrementar
    const decrement = () => {
        if (disabled)
            return;
        const newValue = value - step;
        const validatedValue = validateAndFormatValue(newValue);
        onChange(validatedValue);
    };
    const sanitizeInputValue = (rawValue) => {
        var _a;
        if (rawValue === '' || rawValue === '-' || rawValue === '0' || rawValue === '-0') {
            return rawValue;
        }
        const isNegative = rawValue.startsWith('-');
        let numericSegment = isNegative ? rawValue.slice(1) : rawValue;
        if (allowFloat) {
            numericSegment = numericSegment.replace(/\s+/g, '');
            numericSegment = numericSegment.replace(/,/g, '.');
            numericSegment = numericSegment.replace(/[^0-9.]/g, '');
            const parts = numericSegment.split('.');
            let integerPart = (_a = parts[0]) !== null && _a !== void 0 ? _a : '';
            let decimalPart = parts.slice(1).join('');
            integerPart = integerPart.replace(/^0+(?=\d)/, '');
            if (integerPart === '' && decimalPart.length > 0) {
                integerPart = '0';
            }
            if (decimalPart.length > 0) {
                decimalPart = decimalPart.replace(/[^0-9]/g, '').slice(0, 3);
            }
            let result = integerPart;
            if (decimalPart.length > 0) {
                result = `${integerPart || '0'}.${decimalPart}`;
            }
            if (!result) {
                return '';
            }
            return isNegative ? `-${result}` : result;
        }
        numericSegment = numericSegment.replace(/\D/g, '');
        if (numericSegment === '') {
            return isNegative && allowNegative ? '-' : '0';
        }
        const sanitizedInteger = numericSegment.replace(/^0+(?=\d)/, '') || '0';
        const sanitized = isNegative && allowNegative ? `-${sanitizedInteger}` : sanitizedInteger;
        return sanitized;
    };
    // Manejar cambio en el input
    const handleInputChange = (e) => {
        if (disabled)
            return;
        const rawValue = e.target.value;
        const sanitizedValue = sanitizeInputValue(rawValue);
        if (sanitizedValue !== rawValue) {
            e.target.value = sanitizedValue;
        }
        if (sanitizedValue === '' || sanitizedValue === '-') {
            onChange(allowNegative && sanitizedValue === '-' ? 0 : 0);
            return;
        }
        const normalizedSanitized = sanitizedValue.replace(/,/g, '.');
        const numericValue = allowFloat ? parseFloat(normalizedSanitized) : parseInt(normalizedSanitized, 10);
        if (!isNaN(numericValue)) {
            const validatedValue = validateAndFormatValue(numericValue);
            onChange(validatedValue);
        }
    };
    // Estilos base similares a TextField
    const baseInputClasses = `
    fs-number-stepper__input
    block w-full py-1 text-sm font-light text-foreground appearance-none
    focus:outline-none focus:border-primary
    transition-colors duration-200 px-3 bg-transparent
    ${disabled ? 'bg-neutral cursor-not-allowed' : ''}
    ${className}
  `;
    const labelClasses = `
    text-xs font-medium text-foreground leading-tight
    ${required ? "after:content-['*'] after:text-error after:ml-1" : ""}
  `;
    const buttonClasses = `
    flex items-center justify-center px-2.5 py-1 bg-transparent
    focus:outline-none
    transition-colors duration-200
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `;
    /** Sin label ni icono (p. ej. columna en tabla): misma altura que TextField compact (h-8 / 2rem). */
    const singleRowChrome = !label && !icon;
    const containerClasses = `
    flex border-[1px] border-border rounded-md bg-transparent
    ${singleRowChrome ? 'items-stretch h-8 min-h-[2rem] max-h-[2rem] box-border' : 'items-center'}
    ${disabled ? 'bg-neutral' : ''}
  `;
    // Función para renderizar label/icono
    const renderLabelIcon = () => {
        // Si no hay label ni icono, no renderizar nada
        if (!label && !icon)
            return null;
        const iconElement = icon ? (_jsxs("span", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": true, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 16v-4M12 8h.01" })] }), icon] })) : null;
        const labelElement = label ? (_jsx("label", { className: `${labelClasses} ${icon && iconPosition === 'beside' ? 'ml-1' : ''}`, children: label })) : null;
        // Solo icono
        if (icon && !label) {
            return _jsx("div", { className: "-mt-0.5 mb-0.5", children: iconElement });
        }
        // Solo label (compatibilidad con versión anterior)
        if (label && !icon) {
            return _jsx("div", { className: "-mt-0.5 mb-0.5", children: labelElement });
        }
        // Icono + label
        if (icon && label) {
            if (iconPosition === 'beside') {
                return (_jsxs("div", { className: "-mt-0.5 mb-0.5 flex items-center justify-center", children: [iconElement, labelElement] }));
            }
            else {
                return (_jsxs("div", { className: "-mt-0.5 mb-0.5 flex flex-col items-center gap-0", children: [iconElement, labelElement] }));
            }
        }
        return null;
    };
    return (_jsx(_Fragment, { children: _jsxs("div", { className: containerClasses, "data-test-id": "number-stepper-root", "data-stepper-single-row": singleRowChrome ? 'true' : undefined, children: [_jsx("button", { type: "button", tabIndex: -1, onClick: decrement, disabled: disabled || (min !== undefined && value <= min), className: `${buttonClasses} rounded-l-md border-r border-border`, "data-test-id": `${props['data-test-id']}-decrement`, children: _jsx(Minus, { className: "text-muted-foreground", size: 16 }) }), _jsxs("div", { className: `flex flex-col items-center justify-center flex-1 gap-0 min-w-0 ${singleRowChrome ? 'min-h-0 self-stretch' : ''}`, children: [_jsx("input", { ref: inputRef, type: "number", value: displayValue, onChange: handleInputChange, min: min, max: max, step: allowFloat ? step : step, required: required, placeholder: placeholder, disabled: disabled, className: `${baseInputClasses} rounded-none text-center w-full`, "data-test-id": props['data-test-id'] }), renderLabelIcon()] }), _jsx("button", { type: "button", tabIndex: -1, onClick: increment, disabled: disabled || (max !== undefined && value >= max), className: `${buttonClasses} rounded-r-md border-l border-border`, "data-test-id": `${props['data-test-id']}-increment`, children: _jsx(Plus, { className: "text-muted-foreground", size: 16 }) })] }) }));
};
export default NumberStepper;
//# sourceMappingURL=NumberStepper.js.map