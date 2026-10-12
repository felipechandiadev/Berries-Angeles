import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../Button/Button";
import IconButton from "../IconButton/IconButton";
import "./cards.css";
function useStructured(p) {
    return (p.media != null ||
        p.title != null ||
        p.subtitle != null ||
        p.headerEnd != null ||
        p.content !== undefined ||
        (Array.isArray(p.actions) && p.actions.length > 0) ||
        p.fillHeight === true);
}
function isIconAction(a) {
    return "icon" in a;
}
function cardRootClass(structured, onClick, extra) {
    var _a;
    return [
        "fs-card",
        !structured ? "fs-card--legacy" : "",
        onClick ? "fs-card--clickable" : "",
        (_a = extra === null || extra === void 0 ? void 0 : extra.trim()) !== null && _a !== void 0 ? _a : "",
    ]
        .filter(Boolean)
        .join(" ");
}
export function Card({ className = "", onClick, "data-test-id": dataTestId, media, title, subtitle, headerEnd, content, children, actions, actionsVariant = "default", fillHeight = false, }) {
    const structured = useStructured({
        className,
        onClick,
        "data-test-id": dataTestId,
        media,
        title,
        subtitle,
        headerEnd,
        content,
        children,
        actions,
        fillHeight,
    });
    if (!structured) {
        return (_jsx("div", { onClick: onClick, "data-test-id": dataTestId, className: cardRootClass(false, onClick, className), children: children }));
    }
    const body = content !== undefined ? content : children;
    const hasHeader = title != null || subtitle != null || headerEnd != null;
    const hasActions = Array.isArray(actions) && actions.length > 0;
    const rootClass = [cardRootClass(true, onClick, className), fillHeight ? "fs-card--fill-height" : ""]
        .filter(Boolean)
        .join(" ");
    return (_jsxs("div", { onClick: onClick, "data-test-id": dataTestId, className: rootClass, children: [media != null ? (_jsx("div", { className: fillHeight ? "w-full shrink-0" : "w-full", "data-test-id": "card-media", children: media })) : null, hasHeader ? (_jsxs("div", { className: `fs-card__header ${fillHeight ? "shrink-0" : ""} ${headerEnd != null && (title != null || subtitle != null)
                    ? "flex items-start justify-between gap-3"
                    : headerEnd != null
                        ? "flex justify-end"
                        : ""}`, "data-test-id": "card-header", children: [title != null || subtitle != null ? (_jsxs("div", { className: "fs-card__header-text", children: [title != null ? _jsx("h3", { className: "fs-card__title", children: title }) : null, subtitle != null ? _jsx("p", { className: "fs-card__subtitle", children: subtitle }) : null] })) : null, headerEnd != null ? _jsx("div", { className: "fs-card__header-end", children: headerEnd }) : null] })) : null, body != null ? (_jsx("div", { className: "fs-card__content", "data-test-id": "card-content", children: body })) : null, hasActions ? (_jsx("div", { className: `fs-card__actions${actionsVariant === "embedded" ? " fs-card__actions--embedded" : ""}`, "data-test-id": "card-actions", children: actions.map((a, i) => {
                    var _a, _b, _c, _d;
                    if (isIconAction(a)) {
                        return (_jsx(IconButton, { icon: a.icon, variant: "action", size: "sm", ariaLabel: a.ariaLabel, onClick: a.onClick, disabled: a.disabled, "data-test-id": a["data-test-id"] }, (_a = a.id) !== null && _a !== void 0 ? _a : `card-action-icon-${i}`));
                    }
                    return (_jsx(Button, { type: (_b = a.type) !== null && _b !== void 0 ? _b : "button", variant: (_c = a.variant) !== null && _c !== void 0 ? _c : "outlined", size: "md", disabled: a.disabled, onClick: a.onClick, "data-test-id": a["data-test-id"], children: a.label }, (_d = a.id) !== null && _d !== void 0 ? _d : `card-action-${i}`));
                }) })) : null] }));
}
//# sourceMappingURL=Card.js.map