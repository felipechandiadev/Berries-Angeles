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
import React, { useState, useRef, useEffect, useLayoutEffect, useId } from "react";
import { Eye, EyeOff } from 'lucide-react';
import { useCoarsePointer } from "../../hooks/useCoarsePointer";
import { resolveTouchInputMode, shouldUseTextInputForNumericType, } from "./resolve-touch-input-mode";
import "./textfield.css";
function selectAllFieldContents(el) {
    try {
        el.select();
    }
    catch (_a) {
        // ignore
    }
    const len = el.value.length;
    if (len === 0 || typeof el.setSelectionRange !== "function") {
        return;
    }
    try {
        el.setSelectionRange(0, len);
    }
    catch (_b) {
        // ignore
    }
}
export const TextField = (_a) => {
    var _b, _c;
    var { label, value, onChange, onKeyDown, type = "text", name, placeholder, startSymbol, startAdornment, endSymbol, endAdornment, inlineLeadingAdornment, className = "", variante = "normal", rows, required = false, readOnly = false, disabled = false, title, labelStyle, placeholderColor, currencySymbol = "$", // Default: peso chileno
    allowDecimalComma = false, // Default: no permitir coma
    currencyField, // <--- Añadido para consumir la prop
    currencies, // <--- Añadido para consumir la prop
    phonePrefix, allowLetters = false, passwordVisibilityToggle = true, // Default: true para mostrar toggle en password
    autoComplete, alwaysShowLabel = false, density = "default", labelLayout = "stack", style, selectOnFocus = false, onFocus: onFocusProp, onBlur: onBlurProp, onMouseDown: onMouseDownProp, helperText, inputMode, min, max, step, ["data-test-id"]: dataTestId } = _a, restInputProps = __rest(_a, ["label", "value", "onChange", "onKeyDown", "type", "name", "placeholder", "startSymbol", "startAdornment", "endSymbol", "endAdornment", "inlineLeadingAdornment", "className", "variante", "rows", "required", "readOnly", "disabled", "title", "labelStyle", "placeholderColor", "currencySymbol", "allowDecimalComma", "currencyField", "currencies", "phonePrefix", "allowLetters", "passwordVisibilityToggle", "autoComplete", "alwaysShowLabel", "density", "labelLayout", "style", "selectOnFocus", "onFocus", "onBlur", "onMouseDown", "helperText", "inputMode", "min", "max", "step", "data-test-id"]);
    const isCompact = density === "compact";
    const isInlineLabel = isCompact && labelLayout === "inline" && Boolean(label === null || label === void 0 ? void 0 : label.trim());
    const isCoarsePointer = useCoarsePointer();
    const stableFieldId = useId();
    const inputDomId = (name === null || name === void 0 ? void 0 : name.trim()) ? name : `fs-tf-${stableFieldId.replace(/:/g, "")}`;
    const [focused, setFocused] = useState(false);
    const inputRef = useRef(null);
    const textareaRef = useRef(null);
    const startLeadingRef = useRef(null);
    const endAdornmentRef = useRef(null);
    const [showPassword, setShowPassword] = useState(false);
    const [currencyRawValue, setCurrencyRawValue] = useState(value);
    const passwordToggleLabel = showPassword ? "Ocultar contraseña" : "Mostrar contraseña";
    // Sincronizar currencyRawValue con value cuando este cambie externamente
    useEffect(() => {
        if (type === 'currency') {
            setCurrencyRawValue(value);
        }
    }, [value, type]);
    /** Bloquea edición (onChange, etc.); incluye solo lectura. */
    const isDisabled = disabled || readOnly;
    /**
     * Apariencia “deshabilitada” (opacidad, cursor prohibido). No aplica a autocomplete+readOnly
     * (p. ej. Select): el input es solo lectura pero el combo debe verse activo y con cursor adecuado.
     */
    const showDisabledChrome = disabled || (readOnly && variante !== "autocomplete" && !isInlineLabel);
    /** Inline + readOnly: sin `disabled` nativo para no alterar colores del navegador. */
    const inputNativeDisabled = disabled && !(isInlineLabel && readOnly);
    // Controlador de cambios que respeta el estado disabled
    const handleChange = (e) => {
        if (isDisabled)
            return;
        // Si es teléfono, filtrar letras si no se permite
        if (type === 'tel' && !allowLetters) {
            let rawValue = e.target.value;
            // Remover letras (solo números y prefijo)
            rawValue = rawValue.replace(/[^\d+]/g, '');
            // Mantener el prefijo si existe
            if (phonePrefix && rawValue.startsWith(phonePrefix)) {
                // Ok
            }
            else if (phonePrefix) {
                rawValue = phonePrefix + rawValue.replace(/[^\d]/g, '');
            }
            // Crear evento sintético
            const syntheticEvent = Object.assign(Object.assign({}, e), { target: Object.assign(Object.assign({}, e.target), { value: rawValue }) });
            onChange(syntheticEvent);
            return;
        }
        onChange(e);
    };
    // Función para formatear DNI chileno
    const formatDNI = (value) => {
        // Remover todo lo que no sea número o 'k'/'K'
        let cleanValue = value.replace(/[^0-9kK]/g, '');
        // Convertir 'K' a minúscula
        cleanValue = cleanValue.toLowerCase();
        if (cleanValue.length === 0)
            return '';
        if (cleanValue.length === 1)
            return cleanValue;
        // Formatos específicos para DNI chileno:
        // • XX.XXX.XXX-X (9 dígitos: 8 números + 1 dígito verificador)
        // • X.XXX.XXX-X (8 dígitos: 7 números + 1 dígito verificador) 
        // • XX.XXX.XXX-k (8 dígitos + k: 8 números + 'k')
        // • X.XXX.XXX-k (7 dígitos + k: 7 números + 'k')
        if (cleanValue.length === 9 && !cleanValue.includes('k')) {
            // XX.XXX.XXX-X (8 dígitos + 1 DV)
            const numbers = cleanValue.slice(0, 8);
            const dv = cleanValue.slice(8);
            return numbers.slice(0, 2) + '.' + numbers.slice(2, 5) + '.' + numbers.slice(5) + '-' + dv;
        }
        else if (cleanValue.length === 8 && !cleanValue.includes('k')) {
            // X.XXX.XXX-X (7 dígitos + 1 DV)
            const numbers = cleanValue.slice(0, 7);
            const dv = cleanValue.slice(7);
            return numbers.slice(0, 1) + '.' + numbers.slice(1, 4) + '.' + numbers.slice(4) + '-' + dv;
        }
        else if (cleanValue.length === 9 && cleanValue.endsWith('k')) {
            // XX.XXX.XXX-k (8 dígitos + 'k')
            const numbers = cleanValue.slice(0, 8);
            return numbers.slice(0, 2) + '.' + numbers.slice(2, 5) + '.' + numbers.slice(5) + '-k';
        }
        else if (cleanValue.length === 8 && cleanValue.endsWith('k')) {
            // X.XXX.XXX-k (7 dígitos + 'k')
            const numbers = cleanValue.slice(0, 7);
            return numbers.slice(0, 1) + '.' + numbers.slice(1, 4) + '.' + numbers.slice(4) + '-k';
        }
        else {
            // Para otras longitudes, devolver sin formato especial
            return cleanValue;
        }
    };
    // Función para formatear moneda con símbolo configurable
    const formatCurrency = (raw, symbol = "$") => {
        if (!raw)
            return '';
        if (allowDecimalComma) {
            const sanitized = raw.replace(/[^0-9,]/g, '');
            const hasComma = sanitized.includes(',');
            const endsWithComma = sanitized.endsWith(',');
            const [integerPartRaw = '', decimalPartRaw = ''] = sanitized.split(',');
            const integerDigits = integerPartRaw.replace(/\D/g, '');
            const formattedInteger = integerDigits
                ? Number(integerDigits).toLocaleString('es-CL')
                : hasComma
                    ? '0'
                    : '';
            if (!formattedInteger) {
                return '';
            }
            let result = symbol ? `${symbol} ${formattedInteger}` : formattedInteger;
            if (hasComma) {
                const cleanDecimals = decimalPartRaw.replace(/\D/g, '').slice(0, 2);
                if (cleanDecimals.length > 0) {
                    result += `,${cleanDecimals}`;
                }
                else if (endsWithComma) {
                    result += ',';
                }
            }
            return result;
        }
        const digitsOnly = raw.replace(/\D/g, '');
        if (!digitsOnly)
            return '';
        const formattedInteger = Number(digitsOnly).toLocaleString('es-CL');
        return symbol ? `${symbol} ${formattedInteger}` : formattedInteger;
    };
    const handleDNIChange = (e) => {
        if (isDisabled)
            return; // No procesar si está disabled
        const rawValue = e.target.value;
        const formattedValue = formatDNI(rawValue);
        // Crear un evento sintético con el valor formateado
        const syntheticEvent = Object.assign(Object.assign({}, e), { target: Object.assign(Object.assign({}, e.target), { value: formattedValue }) });
        onChange(syntheticEvent);
    };
    const handleCurrencyChange = (e) => {
        var _a, _b;
        if (isDisabled)
            return;
        const inputValue = (_a = e.target.value) !== null && _a !== void 0 ? _a : '';
        const sanitizedInput = inputValue
            .replace(new RegExp(`\\${currencySymbol}\\s?`, 'g'), '')
            .replace(/\s+/g, '');
        if (allowDecimalComma) {
            const decimalFriendly = sanitizedInput.replace(/\./g, ',');
            const cleaned = decimalFriendly.replace(/[^0-9,]/g, '');
            const endsWithComma = cleaned.endsWith(',');
            const segments = cleaned.split(',');
            const integerDigits = ((_b = segments[0]) !== null && _b !== void 0 ? _b : '').replace(/\D/g, '');
            const decimalDigits = segments
                .slice(1)
                .join('')
                .replace(/\D/g, '')
                .slice(0, 2);
            let normalized = integerDigits;
            if (normalized.length === 0 && (decimalDigits.length > 0 || endsWithComma)) {
                normalized = '0';
            }
            if (decimalDigits.length > 0) {
                normalized = `${normalized},${decimalDigits}`;
            }
            else if (endsWithComma && normalized.length > 0) {
                normalized = `${normalized},`;
            }
            else if (normalized === '0' && !endsWithComma) {
                normalized = '';
            }
            setCurrencyRawValue(normalized);
            const syntheticEvent = Object.assign(Object.assign({}, e), { target: Object.assign(Object.assign({}, e.target), { value: normalized }) });
            onChange(syntheticEvent);
            return;
        }
        const digitsOnly = sanitizedInput.replace(/[^\d]/g, '');
        setCurrencyRawValue(digitsOnly);
        const syntheticEvent = Object.assign(Object.assign({}, e), { target: Object.assign(Object.assign({}, e.target), { value: digitsOnly }) });
        onChange(syntheticEvent);
    };
    // Formatear el valor para mostrar en currency o teléfono
    // Formateo visual para teléfono: prefijo + espacio cada 3 dígitos
    const formatPhone = (value, prefix) => {
        let num = value;
        // Remover prefijo para formatear solo el número
        if (prefix && num.startsWith(prefix)) {
            num = num.slice(prefix.length);
        }
        // Remover espacios
        num = num.replace(/\s+/g, '');
        // Insertar espacio cada 3 dígitos
        let formatted = '';
        for (let i = 0; i < num.length; i += 3) {
            formatted += num.slice(i, i + 3) + (i + 3 < num.length ? ' ' : '');
        }
        // Renderizar igual que currency: prefijo + espacio + número formateado
        return (prefix ? prefix + ' ' : '') + formatted.trim();
    };
    /** Debe declararse antes de `getDisplayValue` (moneda / tel usan el símbolo en slot, no duplicado en el texto). */
    const hasStartSymbol = typeof startSymbol === "string" && startSymbol.length > 0;
    const hasStartLeading = hasStartSymbol || Boolean(startAdornment);
    /** Alineado con `.fs-text-field__icon { left }` y espacio antes del texto editable. */
    const START_LEADING_INSET = "0.75rem";
    const START_LEADING_GAP = "0.5rem";
    const [startLeadingMeasuredPx, setStartLeadingMeasuredPx] = useState(0);
    const [endTrailingMeasuredPx, setEndTrailingMeasuredPx] = useState(0);
    const startLeadingFallbackPx = hasStartSymbol && startSymbol
        ? Math.max(8, startSymbol.length * (isCompact ? 10 : 12))
        : hasStartLeading
            ? (isCompact ? 16 : 20)
            : 0;
    const startLeadingSlotPx = startLeadingMeasuredPx || startLeadingFallbackPx;
    const inputPaddingStart = hasStartLeading
        ? `calc(${START_LEADING_INSET} + ${startLeadingSlotPx}px + ${START_LEADING_GAP})`
        : undefined;
    const startPaddingClass = hasStartLeading ? "" : "pl-3";
    const floatingStartLeft = hasStartLeading ? inputPaddingStart !== null && inputPaddingStart !== void 0 ? inputPaddingStart : START_LEADING_INSET : "0.75rem";
    /** Label flotante: siempre pegado al borde (misma posición con o sin startSymbol/adornment). */
    const floatingLabelLeft = START_LEADING_INSET;
    useLayoutEffect(() => {
        const el = startLeadingRef.current;
        if (!hasStartLeading || !el) {
            setStartLeadingMeasuredPx(0);
            return;
        }
        const apply = () => setStartLeadingMeasuredPx(el.offsetWidth);
        apply();
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
        ro === null || ro === void 0 ? void 0 : ro.observe(el);
        return () => ro === null || ro === void 0 ? void 0 : ro.disconnect();
    }, [hasStartLeading, startSymbol, startAdornment]);
    const hasEndAdornment = Boolean(endAdornment);
    const hasEndSymbol = typeof endSymbol === "string" && endSymbol.length > 0;
    const hasPasswordToggle = type === "password" && passwordVisibilityToggle;
    useLayoutEffect(() => {
        const el = endAdornmentRef.current;
        if (!hasEndAdornment || !el) {
            setEndTrailingMeasuredPx(0);
            return;
        }
        const apply = () => setEndTrailingMeasuredPx(el.offsetWidth);
        apply();
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
        ro === null || ro === void 0 ? void 0 : ro.observe(el);
        return () => ro === null || ro === void 0 ? void 0 : ro.disconnect();
    }, [hasEndAdornment, endAdornment]);
    const endAdornmentSlotPx = hasEndAdornment
        ? endTrailingMeasuredPx || (isCompact ? 52 : 68)
        : 0;
    const getDisplayValue = () => {
        if (type === 'currency') {
            if (!currencyRawValue) {
                return '';
            }
            const symbolForFormat = hasStartSymbol ? "" : currencySymbol;
            return formatCurrency(currencyRawValue, symbolForFormat);
        }
        if (type === "tel" && value) {
            if (hasStartSymbol && phonePrefix && value.startsWith(phonePrefix)) {
                const rest = value.slice(phonePrefix.length).replace(/\s+/g, "");
                let formatted = "";
                for (let i = 0; i < rest.length; i += 3) {
                    formatted += rest.slice(i, i + 3) + (i + 3 < rest.length ? " " : "");
                }
                return formatted.trim();
            }
            return formatPhone(value, phonePrefix);
        }
        return value;
    };
    const displayValue = getDisplayValue();
    const hasInputValue = Boolean(displayValue && displayValue.length > 0);
    const labelAlwaysVisible = type === 'date' || alwaysShowLabel;
    const shrink = labelAlwaysVisible || focused || hasInputValue;
    const [showPlaceholder, setShowPlaceholder] = useState(labelAlwaysVisible ? false : !shrink);
    // Unique class for placeholder styling when placeholderColor is provided
    const placeholderClassRef = React.useRef(null);
    if (placeholderColor && !placeholderClassRef.current) {
        placeholderClassRef.current = `tf-ph-${Math.random().toString(36).slice(2, 9)}`;
    }
    useEffect(() => {
        if (labelAlwaysVisible) {
            setShowPlaceholder(false);
            return;
        }
        if (!shrink) {
            const timeout = setTimeout(() => setShowPlaceholder(true), 250);
            return () => clearTimeout(timeout);
        }
        setShowPlaceholder(false);
    }, [shrink, labelAlwaysVisible]);
    useEffect(() => {
        if (type === 'currency') {
            if (value !== currencyRawValue) {
                setCurrencyRawValue(value);
            }
        }
    }, [value, type, currencyRawValue]);
    // Estilos para variantes
    const variantInput = variante === "contrast"
        ? "border-background text-background focus:border-primary bg-transparent"
        : variante === "autocomplete"
            ? "border-none focus:border-none focus:ring-0 bg-transparent"
            : "text-foreground border-border focus:border-primary bg-transparent";
    const controlVariantClass = (variante === "contrast" ? "fs-text-field__control--contrast " : "") +
        (showDisabledChrome && !isInlineLabel ? "fs-text-field__control--muted " : "");
    const borderlessInputClass = variante === "autocomplete" ? "fs-text-field__input--borderless" : "";
    const disabledStyles = showDisabledChrome
        ? isInlineLabel
            ? "cursor-not-allowed"
            : "opacity-50 cursor-not-allowed bg-muted"
        : "";
    const inlineBodyDisabledClass = isInlineLabel && showDisabledChrome ? " fs-text-field__inline-body--disabled" : "";
    const inlineShellDisabledClass = isInlineLabel && showDisabledChrome && !inlineLeadingAdornment
        ? " fs-text-field__inline-shell--disabled"
        : "";
    const comboReadOnlyCursor = readOnly && variante === "autocomplete" && !disabled ? "cursor-pointer" : "";
    const isTextArea = type === "textarea" || typeof rows === "number";
    const showStaticLabel = isCompact && Boolean(label === null || label === void 0 ? void 0 : label.trim()) && !isInlineLabel;
    const compactInputClass = isCompact ? "fs-text-field__input--compact" : "";
    const inlineInsetInputClass = isInlineLabel ? "fs-text-field__input--inline-inset" : "";
    const inputBorderlessClass = borderlessInputClass || (isInlineLabel ? "fs-text-field__input--borderless" : "");
    const selectOnFocusEnabled = selectOnFocus && !isDisabled && variante !== "autocomplete";
    const useTextInputForSelectOnFocusNumber = selectOnFocusEnabled && type === "number";
    const useTextInputForNumericKeyboard = shouldUseTextInputForNumericType(type, isCoarsePointer, useTextInputForSelectOnFocusNumber);
    const resolvedInputMode = resolveTouchInputMode({
        type,
        inputMode,
        isCoarsePointer,
        allowDecimalComma,
        allowLetters,
        step,
    });
    const handleFocus = (e) => {
        setFocused(true);
        if (selectOnFocusEnabled) {
            const el = e.currentTarget;
            requestAnimationFrame(() => {
                if (document.activeElement === el) {
                    selectAllFieldContents(el);
                }
            });
        }
        onFocusProp === null || onFocusProp === void 0 ? void 0 : onFocusProp(e);
    };
    const handleBlur = (e) => {
        setFocused(false);
        onBlurProp === null || onBlurProp === void 0 ? void 0 : onBlurProp(e);
    };
    const handleMouseDown = (e) => {
        onMouseDownProp === null || onMouseDownProp === void 0 ? void 0 : onMouseDownProp(e);
        if (!selectOnFocusEnabled || e.defaultPrevented) {
            return;
        }
        const el = e.currentTarget;
        if (document.activeElement === el) {
            return;
        }
        e.preventDefault();
        el.focus({ preventScroll: true });
    };
    const focusField = () => {
        var _a, _b;
        if (isTextArea) {
            (_a = textareaRef.current) === null || _a === void 0 ? void 0 : _a.focus();
        }
        else {
            (_b = inputRef.current) === null || _b === void 0 ? void 0 : _b.focus();
        }
    };
    const inlineLabelEl = isInlineLabel ? (_jsxs("label", { className: "fs-text-field__inline-label", htmlFor: inputDomId, "data-test-id": "text-field-static-label", children: [label, required ? _jsx("span", { className: "ml-0.5 text-red-500", children: "*" }) : null] })) : null;
    const controlEl = (_jsxs("div", { className: `fs-text-field__control relative ${controlVariantClass}${className}`.trim(), "data-test-id": "text-field-root", children: [hasStartSymbol && (_jsx("span", { ref: startLeadingRef, className: `fs-text-field__icon ${showDisabledChrome ? "text-muted-foreground opacity-50" : "text-secondary"}`, style: {
                    fontSize: isCompact ? 15 : 20,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                    lineHeight: 1,
                    minHeight: isCompact ? 15 : 20,
                }, children: startSymbol })), !hasStartSymbol && startAdornment && (_jsx("span", { ref: startLeadingRef, className: `fs-text-field__icon ${showDisabledChrome ? "text-muted-foreground opacity-50" : "text-secondary"}`, style: {
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: isCompact ? 16 : 20,
                    minWidth: isCompact ? 16 : 20,
                }, children: startAdornment })), isTextArea ? (_jsx("textarea", Object.assign({ ref: textareaRef, id: inputDomId, name: name, value: value, rows: rows, onFocus: handleFocus, onBlur: handleBlur, onMouseDown: handleMouseDown, onChange: handleChange, onKeyDown: onKeyDown, className: `${(_b = placeholderClassRef.current) !== null && _b !== void 0 ? _b : ""} fs-text-field__input ${compactInputClass} ${inputBorderlessClass} ${inlineInsetInputClass} block ${isCompact ? "min-w-0" : "min-w-[180px]"} pr-4 ${startPaddingClass} ${variantInput} ${disabledStyles} ${comboReadOnlyCursor} z-0`, placeholder: type === "datePicker" ? `Ej: ${new Date().getFullYear()}` :
                    hasInputValue ? "" :
                        (required ? "" : (shrink || !showPlaceholder ? "" : (placeholder !== null && placeholder !== void 0 ? placeholder : label))), required: required, readOnly: readOnly, disabled: inputNativeDisabled, "aria-disabled": isInlineLabel && disabled ? true : undefined, title: title, autoComplete: autoComplete || "off", style: Object.assign(Object.assign({ resize: 'none', paddingTop: '0.75rem' }, (hasStartLeading && inputPaddingStart ? { paddingLeft: inputPaddingStart } : {})), (style || {})), "data-test-id": dataTestId }, restInputProps))) : (_jsxs("div", { className: `relative ${isInlineLabel ? "w-full min-w-0" : ""}`.trim(), children: [_jsx("input", Object.assign({ id: inputDomId, ref: inputRef, type: type === "password" ? (showPassword ? "text" : "password") :
                            type === "dni" || type === "currency" ? "text" :
                                useTextInputForNumericKeyboard ? "text" :
                                    type === "datePicker" ? "number" :
                                        type, name: name, value: displayValue, onFocus: handleFocus, onBlur: handleBlur, onMouseDown: handleMouseDown, onChange: type === "dni" ? handleDNIChange : type === "currency" ? handleCurrencyChange : handleChange, onKeyDown: onKeyDown, className: `${(_c = placeholderClassRef.current) !== null && _c !== void 0 ? _c : ""} fs-text-field__input ${compactInputClass} ${inputBorderlessClass} ${inlineInsetInputClass} block w-full ${isCompact ? "min-w-0" : "min-w-[180px]"} ${startPaddingClass} ${hasEndAdornment ? " pr-3" : (hasEndSymbol || hasPasswordToggle) ? " pr-10" : " pr-3"} ${variantInput} ${disabledStyles} ${comboReadOnlyCursor} z-0`, placeholder: type === "datePicker" ? `Ej: ${new Date().getFullYear()}` :
                            hasInputValue ? "" :
                                (required ? "" : (shrink || !showPlaceholder ? "" : (placeholder !== null && placeholder !== void 0 ? placeholder : label))), required: required, readOnly: readOnly, disabled: inputNativeDisabled, "aria-disabled": isInlineLabel && disabled ? true : undefined, title: title, autoComplete: autoComplete || "off", inputMode: resolvedInputMode, min: type === "datePicker"
                            ? "1800"
                            : useTextInputForNumericKeyboard
                                ? undefined
                                : min, max: type === "datePicker"
                            ? new Date().getFullYear().toString()
                            : useTextInputForNumericKeyboard
                                ? undefined
                                : max, step: useTextInputForNumericKeyboard ? undefined : step, maxLength: type === "dni" ? 12 : type === "datePicker" ? 4 : undefined, "data-test-id": dataTestId, style: Object.assign(Object.assign(Object.assign({}, (hasStartLeading && inputPaddingStart ? { paddingLeft: inputPaddingStart } : {})), (hasEndAdornment && endAdornmentSlotPx > 0
                            ? { paddingRight: `calc(0.35rem + ${endAdornmentSlotPx}px)` }
                            : {})), (style || {})) }, restInputProps)), type === "password" && passwordVisibilityToggle && (_jsx("button", { type: "button", disabled: isDisabled, className: `fs-text-field__password-toggle inline-flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 hover:bg-primary/10 active:scale-95 ${focused ? "text-primary" : "text-secondary"} ${showPassword ? "bg-primary/10 text-primary" : "bg-transparent"} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`, style: { padding: 0 }, onMouseDown: (event) => {
                            if (isDisabled)
                                return;
                            event.preventDefault();
                        }, onClick: () => {
                            var _a;
                            if (isDisabled)
                                return;
                            setShowPassword((prev) => !prev);
                            (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
                        }, "aria-label": passwordToggleLabel, "aria-pressed": showPassword, "data-test-id": "password-visibility-toggle", children: showPassword ? (_jsx(EyeOff, { size: 20, "aria-hidden": true })) : (_jsx(Eye, { size: 20, "aria-hidden": true })) })), hasEndAdornment ? (_jsx("span", { ref: endAdornmentRef, className: `fs-text-field__end-adornment ${showDisabledChrome ? "opacity-50" : ""}`, children: endAdornment })) : null] })), required && !hasInputValue && showPlaceholder && !isCompact && (_jsxs("div", { className: `absolute pointer-events-none text-sm text-muted-foreground transition-opacity duration-300 ${shrink ? 'opacity-0' : 'opacity-100'}`, style: {
                    backgroundColor: "var(--tf-surface, var(--color-background))",
                    left: floatingStartLeft,
                    paddingRight: hasEndAdornment && endAdornmentSlotPx > 0
                        ? `${endAdornmentSlotPx + 12}px`
                        : hasEndSymbol || hasPasswordToggle
                            ? "40px"
                            : "12px",
                    top: isTextArea ? '1.25rem' : '50%',
                    transform: isTextArea ? 'none' : 'translateY(-50%)'
                }, onClick: focusField, children: [type === "datePicker" ? `Ej: ${new Date().getFullYear()}` : (placeholder !== null && placeholder !== void 0 ? placeholder : label), _jsx("span", { className: "ml-1 text-red-500", children: "*" })] })), placeholderColor && placeholderClassRef.current && (_jsx("style", { children: `input.${placeholderClassRef.current}::placeholder, textarea.${placeholderClassRef.current}::placeholder { color: ${placeholderColor} }` })), !isCompact ? (_jsxs("label", { className: `absolute z-20 -top-1 pointer-events-none transition-all duration-300 ease-in-out px-1 font-medium text-xs rounded-md fs-text-field__floating-label ` +
                    (variante === "contrast" ? "text-background" : "text-foreground") +
                    (shrink ? " -translate-y-1 scale-90 opacity-100" : " opacity-0"), style: Object.assign({ left: floatingLabelLeft, marginTop: "0px" }, labelStyle), onClick: focusField, htmlFor: inputDomId, "data-test-id": "text-field-label", children: [label, required && _jsx("span", { className: "text-red-500 ml-1", children: "*" })] })) : null, typeof endSymbol === "string" && endSymbol.length > 0 && (_jsx("span", { className: `fs-text-field__icon--end ${showDisabledChrome ? "text-muted-foreground opacity-50" : "text-secondary"}`, style: {
                    fontSize: isCompact ? 15 : 20,
                    width: isCompact ? 15 : 20,
                    height: isCompact ? 15 : 20,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                }, children: endSymbol }))] }));
    return (_jsxs("div", { className: `${variante === "autocomplete" ? `relative w-full min-h-0${isCompact ? " flex-1" : ""}` : "fs-text-field"} ${showStaticLabel ? "flex min-w-0 flex-col gap-1" : ""} ${isInlineLabel ? "fs-text-field--inline" : ""}`.trim(), children: [showStaticLabel ? (_jsxs("label", { className: "text-[11px] font-medium leading-tight text-foreground", htmlFor: inputDomId, "data-test-id": "text-field-static-label", children: [label, required ? _jsx("span", { className: "ml-1 text-red-500", children: "*" }) : null] })) : null, isInlineLabel ? (_jsxs("div", { className: `fs-text-field__inline-shell${inlineShellDisabledClass}`, children: [inlineLeadingAdornment ? (_jsx("div", { className: "fs-text-field__inline-leading", children: inlineLeadingAdornment })) : null, _jsxs("div", { className: `fs-text-field__inline-body${inlineBodyDisabledClass}`, children: [inlineLabelEl, controlEl] })] })) : (controlEl), helperText ? (_jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: helperText })) : null] }));
};
export default TextField;
//# sourceMappingURL=TextField.js.map