import React from "react";
import "./textfield.css";
interface TextFieldProps {
    label: string;
    required?: boolean;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    type?: string;
    name?: string;
    placeholder?: string;
    /** Caracteres o símbolo corto mostrado al inicio (cadena). Mutuamente excluyente con `startAdornment` si ambos se pasan: gana `startSymbol`. */
    startSymbol?: string;
    /** Contenido React al inicio (p. ej. icono SVG/Lucide); mismo hueco y padding que `startSymbol`. */
    startAdornment?: React.ReactNode;
    /** Igual que `startSymbol` pero al final del campo. */
    endSymbol?: string;
    /** Contenido React al final (p. ej. iconos); el input gana `padding-right` automático según el ancho medido. */
    endAdornment?: React.ReactNode;
    /** Solo `labelLayout="inline"`: contenido a la izquierda del label (p. ej. switch). */
    inlineLeadingAdornment?: React.ReactNode;
    className?: string;
    variante?: "normal" | "contrast" | "autocomplete";
    rows?: number;
    readOnly?: boolean;
    disabled?: boolean;
    /** Tooltip nativo del input (p. ej. explicar solo lectura). */
    title?: string;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    pattern?: string;
    style?: React.CSSProperties;
    labelStyle?: React.CSSProperties;
    placeholderColor?: string;
    currencySymbol?: string;
    allowDecimalComma?: boolean;
    currencyField?: string;
    currencies?: Array<{
        id: string;
        symbol: string;
        label: string;
    }>;
    phonePrefix?: string;
    allowLetters?: boolean;
    passwordVisibilityToggle?: boolean;
    autoComplete?: string;
    /** Si es true, la etiqueta flotante permanece visible (p. ej. Select con placeholder vacío). */
    alwaysShowLabel?: boolean;
    /**
     * `compact`: altura alineada al NumberStepper (~36px), label opcional arriba en columna (sin label flotante).
     * Si `label` está vacío, solo reduce la altura del control (útil en tablas con encabezado de columna).
     */
    density?: "default" | "compact";
    /** `inline`: label dentro del borde, a la izquierda del input (solo `density="compact"`). */
    labelLayout?: "stack" | "inline";
    /**
     * Al recibir foco, selecciona todo el texto (útil en cantidades, códigos, búsquedas).
     * Con ratón: primer clic selecciona; si ya tenía foco, permite colocar el cursor.
     * No aplica en `variante="autocomplete"`, `readOnly` ni `disabled`.
     */
    selectOnFocus?: boolean;
    onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onMouseDown?: (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    /** Texto de ayuda bajo el campo. */
    helperText?: string;
    ["data-test-id"]?: string;
}
export declare const TextField: React.FC<TextFieldProps>;
export default TextField;
//# sourceMappingURL=TextField.d.ts.map