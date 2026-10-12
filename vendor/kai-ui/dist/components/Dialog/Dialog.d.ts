import React from 'react';
import './dialog.css';
interface DialogProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'custom';
    customSize?: Partial<Record<BreakpointKey, number>>;
    maxWidth?: number | string;
    fullWidth?: boolean;
    minWidth?: number | string;
    scroll?: 'body' | 'paper';
    height?: number | string;
    maxHeight?: number | string;
    minHeight?: number | string;
    animationDuration?: number;
    overflowBehavior?: 'visible' | 'hidden' | 'auto';
    zIndex?: number;
    disableBackdropClick?: boolean;
    persistent?: boolean;
    className?: string;
    contentStyle?: React.CSSProperties;
    /**
     * Zona fija entre el cuerpo (`children`) y el pie (`actions`):
     * errores, avisos y cualquier `Alert` (success, info, warning, error).
     * No forma parte del scroll del cuerpo cuando `scroll="paper"`.
     */
    alertArea?: React.ReactNode;
    actions?: React.ReactNode;
    hideActions?: boolean;
    actionsJustify?: 'between' | 'start' | 'end' | 'center';
    showCloseButton?: boolean;
    /** Sin fondo propio en la franja del título (misma superficie visual que el papel del diálogo). */
    headerTransparent?: boolean;
    closeButtonText?: string;
    onCloseButtonClick?: () => void;
    'data-test-id'?: string;
}
type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
declare const Dialog: React.FC<DialogProps>;
export default Dialog;
//# sourceMappingURL=Dialog.d.ts.map