import React from 'react';
import * as Icons from 'lucide-react';
import './icon-button.css';
type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
type LucideIconName = keyof typeof Icons;
export type IconButtonVariant = 'action' | 'primary' | 'secondary' | 'primaryCircle' | 'secondaryCircle' | 'neutral' | 'text' | 'outlined';
/** @deprecated Use IconButtonVariant names (action, primary, secondary, neutral). */
type IconButtonVariantLegacy = 'containedPrimary' | 'containedSecondary' | 'basic' | 'basicSecondary' | 'ghost';
interface IconButtonProps {
    icon: LucideIconName;
    variant?: IconButtonVariant | IconButtonVariantLegacy;
    size?: IconButtonSize;
    /** Grosor del trazo del icono Lucide (por defecto 2.25, para igualar la intensidad de los iconos sueltos de la app). Valores mayores = icono más “fuerte”. */
    strokeWidth?: number;
    disabled?: boolean;
    isLoading?: boolean;
    className?: string;
    /** Clases aplicadas al SVG del icono (p. ej. `fill-current` en estrella destacada). */
    iconClassName?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    ariaLabel?: string;
    [key: string]: any;
}
declare const IconButton: React.FC<IconButtonProps>;
export default IconButton;
//# sourceMappingURL=IconButton.d.ts.map