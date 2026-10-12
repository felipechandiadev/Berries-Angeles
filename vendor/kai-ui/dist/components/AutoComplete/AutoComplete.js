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
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import DropdownList, { dropdownOptionClass } from "../DropdownList/DropdownList";
import IconButton from "../IconButton/IconButton";
import { TextField } from "../TextField/TextField";
const AutoComplete = (_a) => {
    var { options, label, placeholder, value = null, onChange, onInputChange, name, required, getOptionLabel, getOptionValue, filterOption, alwaysShowLabel = false, density = "default" } = _a, props = __rest(_a, ["options", "label", "placeholder", "value", "onChange", "onInputChange", "name", "required", "getOptionLabel", "getOptionValue", "filterOption", "alwaysShowLabel", "density"]);
    // Helper functions with defaults for backward compatibility
    const defaultGetOptionLabel = (option) => {
        if (typeof option === 'string')
            return option;
        if (option && typeof option === 'object' && 'label' in option) {
            return option.label;
        }
        return String(option);
    };
    const defaultGetOptionValue = (option) => {
        if (typeof option === 'string')
            return option;
        if (option && typeof option === 'object' && 'id' in option) {
            return option.id;
        }
        return option;
    };
    const getLabel = getOptionLabel || defaultGetOptionLabel;
    const getValue = getOptionValue || defaultGetOptionValue;
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [inputValue, setInputValue] = useState(value ? getLabel(value) : "");
    const [focused, setFocused] = useState(false);
    const [open, setOpen] = useState(false);
    const [validationTriggered, setValidationTriggered] = useState(false);
    const containerRef = useRef(null);
    const blurCloseTimerRef = useRef(null);
    const isSelectingOptionRef = useRef(false);
    /** Refs por instancia (evita colisiones entre múltiples AutoComplete en la página). */
    const itemRefsRef = useRef(new Map());
    const disabled = props.disabled;
    const isCompact = density === "compact";
    // Sync inputValue with value prop
    useEffect(() => {
        setInputValue(value ? getLabel(value) : "");
    }, [value]);
    const shrink = focused || inputValue.length > 0;
    const filteredOptions = useMemo(() => options.filter((opt) => {
        if (typeof filterOption === "function") {
            return filterOption(opt, inputValue);
        }
        return getLabel(opt).toLowerCase().includes(inputValue.toLowerCase());
    }), [options, inputValue, filterOption, getLabel]);
    // Mantener el índice destacado válido al cambiar el filtrado/abierto.
    useEffect(() => {
        if (!open) {
            return;
        }
        if (filteredOptions.length === 0) {
            if (highlightedIndex !== -1) {
                setHighlightedIndex(-1);
            }
            return;
        }
        if (highlightedIndex >= filteredOptions.length) {
            setHighlightedIndex(filteredOptions.length - 1);
        }
    }, [open, filteredOptions.length, highlightedIndex]);
    const handleSelect = useCallback((option) => {
        setInputValue(getLabel(option));
        setOpen(false);
        setHighlightedIndex(-1);
        onChange === null || onChange === void 0 ? void 0 : onChange(option);
    }, [getLabel, onChange]);
    const handleInputKeyDown = useCallback((e) => {
        if (disabled) {
            return;
        }
        const list = filteredOptions;
        const hasItems = list.length > 0;
        // Abrir con teclado aunque aún no esté abierto.
        if (!open) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
                if (!hasItems) {
                    return;
                }
                e.preventDefault();
                setOpen(true);
                setHighlightedIndex(e.key === "ArrowUp" ? list.length - 1 : 0);
            }
            return;
        }
        if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            setHighlightedIndex(-1);
            return;
        }
        if (!hasItems) {
            return;
        }
        if (e.key === "ArrowDown") {
            e.preventDefault();
            e.stopPropagation();
            setHighlightedIndex((i) => (i < list.length - 1 ? i + 1 : 0));
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            e.stopPropagation();
            setHighlightedIndex((i) => (i > 0 ? i - 1 : list.length - 1));
            return;
        }
        if (e.key === "Enter") {
            // Evitar submit de formularios al seleccionar.
            if (highlightedIndex >= 0 && highlightedIndex < list.length) {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(list[highlightedIndex]);
            }
        }
    }, [disabled, filteredOptions, open, highlightedIndex, handleSelect]);
    /**
     * Respaldo: manejar flechas/Enter aun si el foco no está exactamente en el <input>
     * (p. ej. foco en el wrapper o en un botón dentro del control).
     */
    useEffect(() => {
        const onDocKeyDown = (e) => {
            if (disabled)
                return;
            if (e.defaultPrevented)
                return;
            const root = containerRef.current;
            if (!root)
                return;
            const active = document.activeElement;
            if (!active || !root.contains(active))
                return;
            // Si el foco está en el input/textarea, el handler `onKeyDown` del TextField
            // ya se encarga de la navegación. Evita doble incremento (salta opciones).
            const tag = active.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") {
                return;
            }
            const list = filteredOptions;
            const hasItems = list.length > 0;
            if (!open) {
                if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
                    if (!hasItems)
                        return;
                    e.preventDefault();
                    setOpen(true);
                    setHighlightedIndex(e.key === "ArrowUp" ? list.length - 1 : 0);
                }
                return;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
                setHighlightedIndex(-1);
                return;
            }
            if (!hasItems)
                return;
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightedIndex((i) => (i < list.length - 1 ? i + 1 : 0));
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightedIndex((i) => (i > 0 ? i - 1 : list.length - 1));
                return;
            }
            if (e.key === "Enter") {
                if (highlightedIndex >= 0 && highlightedIndex < list.length) {
                    e.preventDefault();
                    handleSelect(list[highlightedIndex]);
                }
            }
        };
        // Bubble: así el input puede `stopPropagation()` y evitar dobles eventos.
        document.addEventListener("keydown", onDocKeyDown);
        return () => document.removeEventListener("keydown", onDocKeyDown);
    }, [disabled, filteredOptions, open, highlightedIndex, handleSelect]);
    // Scroll al item destacado (auto evita saltos bruscos con listas largas)
    useEffect(() => {
        if (highlightedIndex >= 0 && open) {
            const highlightedKey = getValue(filteredOptions[highlightedIndex]);
            const element = itemRefsRef.current.get(highlightedKey);
            if (element) {
                element.scrollIntoView({ block: "nearest" });
            }
        }
    }, [highlightedIndex, open, filteredOptions, getValue]);
    const handleValidation = () => {
        if (required && (!value || (inputValue && !value))) {
            setValidationTriggered(true);
            setOpen(false); // Prevent dropdown from opening when validation fails
        }
        else {
            setValidationTriggered(false);
        }
    };
    const focusInput = useCallback(() => {
        var _a, _b;
        (_b = (_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.querySelector('input[data-test-id="auto-complete-input"]')) === null || _b === void 0 ? void 0 : _b.focus();
    }, []);
    const cancelScheduledClose = useCallback(() => {
        if (blurCloseTimerRef.current != null) {
            clearTimeout(blurCloseTimerRef.current);
            blurCloseTimerRef.current = null;
        }
    }, []);
    const scheduleClose = useCallback(() => {
        cancelScheduledClose();
        blurCloseTimerRef.current = setTimeout(() => {
            var _a;
            blurCloseTimerRef.current = null;
            if (isSelectingOptionRef.current) {
                return;
            }
            const active = document.activeElement;
            if (active && ((_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.contains(active))) {
                return;
            }
            setOpen(false);
        }, 150);
    }, [cancelScheduledClose]);
    useEffect(() => () => cancelScheduledClose(), [cancelScheduledClose]);
    /** Evita blur del input al pulsar chevron / limpiar (causa parpadeo abrir-cerrar). */
    const handleChromeMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        cancelScheduledClose();
    };
    const handleChevronClick = (e) => {
        e.stopPropagation();
        cancelScheduledClose();
        focusInput();
        if (filteredOptions.length === 0) {
            setOpen(false);
            return;
        }
        setOpen((prev) => !prev);
    };
    const handleContainerBlur = (e) => {
        var _a;
        const next = e.relatedTarget;
        if (next && ((_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.contains(next))) {
            return;
        }
        setFocused(false);
        handleValidation();
        setHighlightedIndex(-1);
        if (!isSelectingOptionRef.current) {
            scheduleClose();
        }
    };
    const handleContainerFocusCapture = (e) => {
        if (disabled) {
            return;
        }
        const target = e.target;
        if (target.closest('[data-test-id="auto-complete-dropdown-icon"]') ||
            target.closest('[data-test-id="auto-complete-clear-icon"]')) {
            return;
        }
        setFocused(true);
        if (filteredOptions.length > 0) {
            setOpen(true);
        }
    };
    const handleClear = () => {
        setInputValue(""); // Clear the input text
        setOpen(false); // Close the dropdown
        setHighlightedIndex(-1); // Reset the highlighted index
        onInputChange === null || onInputChange === void 0 ? void 0 : onInputChange("");
        onChange === null || onChange === void 0 ? void 0 : onChange(null); // Clear the selected option
    };
    const compactFloatCaption = ((label === null || label === void 0 ? void 0 : label.trim()) || (placeholder === null || placeholder === void 0 ? void 0 : placeholder.trim()) || "").trim();
    const useCompactFloatingLabel = isCompact &&
        (Boolean(label === null || label === void 0 ? void 0 : label.trim()) || alwaysShowLabel || Boolean(placeholder === null || placeholder === void 0 ? void 0 : placeholder.trim()));
    return (_jsxs("div", { className: "fs-dropdown-container", ref: containerRef, "data-test-id": props["data-test-id"] || "auto-complete-root", "data-has-options": options.length > 0 ? "true" : "false", children: [_jsxs("div", { className: `relative w-full min-w-0 fs-text-field__combo-shell rounded-md border border-border focus-within:border-primary ${isCompact
                    ? "flex h-8 min-h-8 max-h-8 items-stretch box-border"
                    : "flex fs-control-height-md items-stretch"} ${disabled ? "fs-text-field__combo-shell--muted cursor-not-allowed opacity-50" : ""}`.trim(), onFocusCapture: handleContainerFocusCapture, onBlur: handleContainerBlur, tabIndex: -1, children: [_jsx(TextField, { label: useCompactFloatingLabel ? compactFloatCaption : (label || ""), value: inputValue, onChange: e => {
                            const newValue = e.target.value;
                            setInputValue(newValue);
                            onInputChange === null || onInputChange === void 0 ? void 0 : onInputChange(newValue);
                            setOpen(true);
                            setHighlightedIndex(-1);
                        }, onKeyDown: handleInputKeyDown, placeholder: placeholder, name: name, required: required, "data-test-id": "auto-complete-input", className: `${isCompact ? "min-h-0 min-w-0 flex-1" : "w-full"} pr-20`.trim(), variante: "autocomplete", disabled: disabled, alwaysShowLabel: useCompactFloatingLabel
                            ? alwaysShowLabel || !(label === null || label === void 0 ? void 0 : label.trim())
                            : alwaysShowLabel, density: density }), value && !disabled && (_jsx(IconButton, { icon: "X", variant: "action", className: "absolute right-10 top-1/2 z-20 flex h-6 w-6 min-h-6 min-w-6 -translate-y-1/2 items-center justify-center p-0", onMouseDown: handleChromeMouseDown, onClick: handleClear, "aria-label": "Limpiar selecci\u00F3n", "data-test-id": "auto-complete-clear-icon", tabIndex: -1, disabled: disabled })), !disabled && (_jsx(IconButton, { icon: "ChevronDown", variant: "action", className: "absolute right-2 top-1/2 z-20 flex h-6 w-6 min-h-6 min-w-6 -translate-y-1/2 items-center justify-center p-0", tabIndex: -1, "aria-label": "Desplegar opciones", onMouseDown: handleChromeMouseDown, onClick: handleChevronClick, "data-test-id": "auto-complete-dropdown-icon", disabled: disabled }))] }), _jsx(DropdownList, { open: open && filteredOptions.length > 0, testId: "auto-complete-list", highlightedIndex: highlightedIndex, onHoverChange: (idx) => {
                    // DropdownList now handles hover, we just track it if needed
                }, usePortal: true, anchorRef: containerRef, children: filteredOptions.map((opt, idx) => {
                    const optValue = getValue(opt);
                    const isHighlighted = highlightedIndex === idx;
                    return (_jsx("li", { ref: (el) => {
                            if (el)
                                itemRefsRef.current.set(optValue, el);
                            else
                                itemRefsRef.current.delete(optValue);
                        }, className: dropdownOptionClass, onMouseDown: () => {
                            isSelectingOptionRef.current = true;
                            cancelScheduledClose();
                            handleSelect(opt);
                            window.setTimeout(() => {
                                isSelectingOptionRef.current = false;
                            }, 200);
                        }, onMouseEnter: () => {
                            setHighlightedIndex(idx);
                        }, role: "option", "aria-selected": isHighlighted, "data-test-id": `auto-complete-option-${optValue}`, children: getLabel(opt) }, optValue));
                }) })] }));
};
export default AutoComplete;
//# sourceMappingURL=AutoComplete.js.map