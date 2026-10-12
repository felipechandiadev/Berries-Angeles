import React from "react";
export interface Option {
    id: string | number;
    label: string;
}
interface SelectProps {
    label?: string;
    options: Option[];
    placeholder?: string;
    value?: string | number | null;
    onChange?: (id: string | number | null) => void;
    required?: boolean;
    name?: string;
    variant?: "default" | "minimal";
    /** Misma altura que `TextField` con `density="compact"` (~2rem). */
    density?: "default" | "compact";
    /** `inline`: label y control en la misma fila (`default` o `compact`). */
    labelLayout?: "stack" | "inline";
    ["data-test-id"]?: string;
    allowClear?: boolean;
    disabled?: boolean;
    /** Oculta el icono de despliegue (ChevronDown). Útil cuando no hay opciones. */
    hideDropdownIcon?: boolean;
    className?: string;
    /** Mantiene visible la etiqueta del campo aunque no haya valor seleccionado. */
    alwaysShowLabel?: boolean;
}
declare const Select: React.FC<SelectProps>;
export default Select;
//# sourceMappingURL=Select.d.ts.map