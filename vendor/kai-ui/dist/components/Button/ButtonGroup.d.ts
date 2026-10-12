import React from "react";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";
export type ButtonGroupDensity = "default" | "compact";
export type ButtonGroupProps = {
    children: React.ReactNode;
    className?: string;
    /** Variante por defecto de los ítems hijos. */
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** `compact`: ~22px alto, texto 10px, padding horizontal mínimo. */
    density?: ButtonGroupDensity;
    "data-test-id"?: string;
    /** Etiqueta accesible del grupo (p. ej. «Modo de vista»). */
    "aria-label"?: string;
};
export type ButtonGroupItemProps = Omit<React.ComponentProps<typeof Button>, "fullWidth" | "color"> & {
    /** Estado activo en grupos tipo toggle (segmented control). */
    selected?: boolean;
};
export declare function ButtonGroup({ children, className, variant, size, density, "data-test-id": dataTestId, "aria-label": ariaLabel, }: ButtonGroupProps): React.JSX.Element;
export declare function ButtonGroupItem({ selected, variant, size, className, ...props }: ButtonGroupItemProps): React.JSX.Element;
export type ButtonGroupToggleOption = {
    id: string;
    label: React.ReactNode;
    disabled?: boolean;
};
export type ButtonGroupToggleProps = {
    value: string;
    onChange: (id: string) => void;
    options: ButtonGroupToggleOption[];
    className?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    density?: ButtonGroupDensity;
    "data-test-id"?: string;
    "aria-label"?: string;
};
/** Grupo de selección única (toggle) sobre `ButtonGroupItem`. */
export declare function ButtonGroupToggle({ value, onChange, options, className, variant, size, density, "data-test-id": dataTestId, "aria-label": ariaLabel, }: ButtonGroupToggleProps): React.JSX.Element;
//# sourceMappingURL=ButtonGroup.d.ts.map