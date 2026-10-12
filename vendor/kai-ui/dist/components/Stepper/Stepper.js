"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import "./stepper.css";
/**
 * Chrome presentacional para flujos multi-paso: puntos de estado,
 * título/descripción del paso actual y ranura para el cuerpo del paso.
 * No incluye lógica de formulario ni botones de navegación por defecto.
 */
export const Stepper = ({ steps, activeIndex, children, footer, headerAside, allowClickCompletedSteps = false, onCompletedStepClick, className = "", contentClassName = "", "data-test-id": dataTestId, }) => {
    const total = steps.length;
    const safeIndex = total === 0 ? 0 : Math.min(Math.max(activeIndex, 0), total - 1);
    const current = steps[safeIndex];
    return (_jsxs("div", { className: ["flex w-full flex-col gap-4", className].filter(Boolean).join(" "), "data-test-id": dataTestId, children: [total > 0 ? (_jsxs("nav", { className: "flex flex-col gap-4", role: "navigation", "aria-label": "Pasos del asistente", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsx("div", { className: "flex flex-wrap items-center gap-2", children: steps.map((step, index) => {
                                    const isActive = index === safeIndex;
                                    const isCompleted = index < safeIndex;
                                    const isClickable = allowClickCompletedSteps && isCompleted && onCompletedStepClick;
                                    const dotClasses = [
                                        "fs-stepper__dot flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-200",
                                        isActive
                                            ? "border-secondary bg-secondary text-white shadow-sm"
                                            : isCompleted
                                                ? "border-primary/40 bg-primary/15 text-primary"
                                                : "border-border bg-card text-muted-foreground",
                                    ].join(" ");
                                    return (_jsx("button", { type: "button", disabled: !isClickable && !isActive, "aria-current": isActive ? "step" : undefined, "aria-label": `Paso ${index + 1}: ${step.title}`, className: [
                                            dotClasses,
                                            isClickable ? "cursor-pointer hover:border-primary" : "",
                                            !isClickable && !isActive ? "cursor-default opacity-90" : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" "), "data-test-id": `stepper-dot-${step.id}`, onClick: () => {
                                            if (isClickable) {
                                                onCompletedStepClick === null || onCompletedStepClick === void 0 ? void 0 : onCompletedStepClick(index);
                                            }
                                        }, children: isCompleted ? (_jsx("span", { className: "text-sm leading-none", "aria-hidden": true, children: "\u2713" })) : (index + 1) }, step.id));
                                }) }), headerAside ? (_jsx("div", { className: "min-w-0 shrink text-right text-sm text-muted-foreground", children: headerAside })) : null] }), _jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-card shadow-sm", children: _jsx("div", { className: "relative p-5 sm:p-6", children: _jsx("div", { className: "relative min-w-0 text-right", children: current ? (_jsxs(_Fragment, { children: [_jsx("h3", { className: "text-xl font-semibold tracking-tight text-foreground", children: current.title }), current.description ? (_jsx("p", { className: "mt-1 text-sm leading-relaxed text-muted-foreground", children: current.description })) : null] })) : null }) }) })] })) : null, children ? (_jsx("div", { className: ["min-h-0 w-full flex-1", contentClassName].filter(Boolean).join(" "), "data-test-id": dataTestId ? `${dataTestId}-content` : undefined, children: children })) : null, footer ? (_jsx("div", { className: "border-t border-border pt-3", "data-test-id": dataTestId ? `${dataTestId}-footer` : undefined, children: footer })) : null] }));
};
export default Stepper;
//# sourceMappingURL=Stepper.js.map