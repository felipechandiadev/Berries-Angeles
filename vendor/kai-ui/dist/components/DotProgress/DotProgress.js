'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import "./dot-progress.css";
const DEFAULT_SIZE = 16;
const DEFAULT_GAP = 8;
const DEFAULT_PRIMARY = "var(--color-primary)";
const DEFAULT_NEUTRAL = "var(--color-neutral)";
const DEFAULT_INTERVAL = 350;
const WAVE_STAGGER_S = 0.16;
const DotProgress = ({ size = DEFAULT_SIZE, gap = DEFAULT_GAP, colorPrimary = DEFAULT_PRIMARY, colorNeutral = DEFAULT_NEUTRAL, className = "", interval = DEFAULT_INTERVAL, count, totalSteps = 5, activeStep, variant = "step", }) => {
    const steps = Math.max(1, count !== null && count !== void 0 ? count : totalSteps);
    const isWave = variant === "wave";
    const [active, setActive] = useState(activeStep !== null && activeStep !== void 0 ? activeStep : 0);
    useEffect(() => {
        if (isWave)
            return;
        if (activeStep !== undefined) {
            setActive(activeStep);
            return;
        }
        const timer = setInterval(() => {
            setActive((prev) => (prev + 1) % steps);
        }, interval);
        return () => clearInterval(timer);
    }, [interval, steps, activeStep, isWave]);
    return (_jsx("span", { className: `inline-flex items-center ${className}`, style: { gap, paddingTop: isWave ? Math.round(size * 0.7) : undefined }, "data-test-id": "dot-progress-root", "data-variant": variant, "data-count": steps, role: "status", "aria-hidden": true, children: Array.from({ length: steps }, (_, i) => {
            const isActive = !isWave && i === active % steps;
            const pulse = isActive && activeStep === undefined;
            return (_jsx("span", { className: isWave
                    ? "fs-dot-progress__dot fs-dot-progress__dot--wave"
                    : pulse
                        ? "fs-dot-progress__dot fs-dot-progress__dot--pulse"
                        : "fs-dot-progress__dot", style: {
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    backgroundColor: isWave || isActive ? colorPrimary : colorNeutral,
                    display: "inline-block",
                    flexShrink: 0,
                    transition: isWave ? undefined : "background-color 0.2s",
                    animationDelay: isWave ? `${i * WAVE_STAGGER_S}s` : undefined,
                    cursor: "default",
                } }, i));
        }) }));
};
export default DotProgress;
//# sourceMappingURL=DotProgress.js.map