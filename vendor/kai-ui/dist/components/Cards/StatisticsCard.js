import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "./Card";
const valueToneClass = {
    primary: "fs-statistics-card__value--primary",
    success: "fs-statistics-card__value--success",
    info: "fs-statistics-card__value--info",
    warning: "fs-statistics-card__value--warning",
};
export function StatisticsCard({ label, value, hint, tone = "primary", compact = false, className = "", onClick, "data-test-id": dataTestId, }) {
    const rootClass = [className, compact ? "fs-statistics-card--compact" : ""].filter(Boolean).join(" ");
    return (_jsxs(Card, { className: rootClass, onClick: onClick, "data-test-id": dataTestId, children: [_jsx("p", { className: "fs-statistics-card__label", children: label }), _jsx("p", { className: `fs-statistics-card__value ${valueToneClass[tone]}`, children: value }), hint ? _jsx("p", { className: "fs-statistics-card__hint", children: hint }) : null] }));
}
//# sourceMappingURL=StatisticsCard.js.map