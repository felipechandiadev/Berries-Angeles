/**
 * Prioridad: selección > apariencia custom > hover > default.
 */
export function resolveRowCellBackgroundColor(params) {
    var _a;
    // Una fila expandida mantiene fondo blanco (base) por encima de selección/hover.
    if (params.isExpanded) {
        return 'var(--color-background)';
    }
    if (params.isSelected) {
        return 'color-mix(in srgb, var(--color-primary) 16%, var(--color-background))';
    }
    if ((_a = params.appearance) === null || _a === void 0 ? void 0 : _a.backgroundColor) {
        return params.appearance.backgroundColor;
    }
    if (params.isHovered) {
        return 'var(--color-hover)';
    }
    return 'var(--color-background)';
}
//# sourceMappingURL=rowAppearance.js.map