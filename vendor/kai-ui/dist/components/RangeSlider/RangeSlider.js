"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import "./range-slider.css";
const RangeSlider = ({ min = 0, max = 100, value, onChange }) => {
    const [values, setValues] = useState(value || [min, max]);
    const [dragging, setDragging] = useState(null);
    const trackRef = useRef(null);
    useEffect(() => {
        if (value)
            setValues(value);
    }, [value]);
    useEffect(() => {
        const handleMouseUp = () => setDragging(null);
        window.addEventListener("mouseup", handleMouseUp);
        return () => window.removeEventListener("mouseup", handleMouseUp);
    }, []);
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!dragging || !trackRef.current)
                return;
            const track = trackRef.current;
            const rect = track.getBoundingClientRect();
            const percent = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
            const newValue = Math.round(percent * (max - min) + min);
            if (dragging === "min") {
                const clamped = Math.min(newValue, values[1]);
                setValues([clamped, values[1]]);
                onChange === null || onChange === void 0 ? void 0 : onChange([clamped, values[1]]);
            }
            else {
                const clamped = Math.max(newValue, values[0]);
                setValues([values[0], clamped]);
                onChange === null || onChange === void 0 ? void 0 : onChange([values[0], clamped]);
            }
        };
        if (dragging) {
            window.addEventListener("mousemove", handleMouseMove);
            return () => window.removeEventListener("mousemove", handleMouseMove);
        }
    }, [dragging, min, max, values, onChange]);
    const getPercent = (val) => ((val - min) / (max - min)) * 100;
    return (_jsxs("div", { className: "w-full", "data-test-id": "range-slider-root", children: [_jsx("div", { className: "mb-1 flex items-center justify-between", children: _jsx("span", { className: "text-xs text-foreground font-light", "data-test-id": "range-slider-label", children: "Rango" }) }), _jsxs("div", { className: "fs-range-slider", ref: trackRef, "data-test-id": "range-slider-track", children: [_jsx("div", { className: "fs-range-slider__track", "data-test-id": "range-slider-bg" }), _jsx("div", { className: "fs-range-slider__fill", style: { left: `${getPercent(values[0])}%`, width: `${getPercent(values[1]) - getPercent(values[0])}%` }, "data-test-id": "range-slider-fill" }), _jsx("button", { type: "button", className: "fs-range-slider__thumb", style: { left: `${getPercent(values[0])}%`, transform: "translate(-50%, -50%)" }, onMouseDown: () => setDragging("min"), "aria-label": "Min value", "data-test-id": "range-slider-thumb-min" }), _jsx("button", { type: "button", className: "fs-range-slider__thumb", style: { left: `${getPercent(values[1])}%`, transform: "translate(-50%, -50%)" }, onMouseDown: () => setDragging("max"), "aria-label": "Max value", "data-test-id": "range-slider-thumb-max" })] }), _jsxs("div", { className: "flex w-full justify-between mt-2", "data-test-id": "range-slider-values", children: [_jsx("span", { className: "text-xs text-foreground font-light", "data-test-id": "range-slider-value-min", children: values[0] }), _jsx("span", { className: "text-xs text-foreground font-light", "data-test-id": "range-slider-value-max", children: values[1] })] })] }));
};
export default RangeSlider;
//# sourceMappingURL=RangeSlider.js.map