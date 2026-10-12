import React from "react";
export interface Option {
    id: string | number;
    label: string;
}
interface AutoCompleteProps<T = Option> {
    options: T[];
    label?: string;
    placeholder?: string;
    value?: T | null;
    onChange?: (option: T | null) => void;
    onInputChange?: (value: string) => void;
    name?: string;
    required?: boolean;
    getOptionLabel?: (option: T) => string;
    getOptionValue?: (option: T) => any;
    filterOption?: (option: T, inputValue: string) => boolean;
    ["data-test-id"]?: string;
    disabled?: boolean;
    /** Etiqueta flotante siempre visible (útil con placeholder vacío o como selector). */
    alwaysShowLabel?: boolean;
    /** Misma altura que `TextField` con `density="compact"` (~2rem). */
    density?: "default" | "compact";
}
declare const AutoComplete: <T = Option>({ options, label, placeholder, value, onChange, onInputChange, name, required, getOptionLabel, getOptionValue, filterOption, alwaysShowLabel, density, ...props }: AutoCompleteProps<T>) => React.JSX.Element;
export default AutoComplete;
//# sourceMappingURL=AutoComplete.d.ts.map