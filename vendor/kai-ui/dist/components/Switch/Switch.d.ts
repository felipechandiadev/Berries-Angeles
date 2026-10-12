import React from 'react';
import './switch.css';
export type SwitchOptionLabels = {
    /** Opción cuando `checked` es false */
    off: string;
    /** Opción cuando `checked` es true */
    on: string;
};
export type SwitchDensity = 'default' | 'compact';
interface SwitchProps {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    /** Etiqueta única (izquierda o derecha del control) */
    label?: string;
    labelPosition?: 'left' | 'right';
    /** Dos etiquetas (off | switch | on); la activa resalta según `checked` */
    optionLabels?: SwitchOptionLabels;
    disabled?: boolean;
    /** `compact`: track más pequeño, sin margen superior (p. ej. dentro de TextField inline). */
    density?: SwitchDensity;
    className?: string;
    ['data-test-id']?: string;
}
declare const Switch: React.FC<SwitchProps>;
export default Switch;
//# sourceMappingURL=Switch.d.ts.map