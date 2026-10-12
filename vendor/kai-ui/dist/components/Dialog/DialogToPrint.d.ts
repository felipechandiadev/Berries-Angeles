import React from 'react';
interface DialogToPrintProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    /**
     * Optional size forwarded to the base Dialog component.
     * Defaults to `lg` which gives a comfortable width for printable content.
     */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
    /**
     * Text for the print action button.
     */
    printLabel?: string;
    /**
     * Text for the close action button.
     */
    closeLabel?: string;
    /**
     * Optional className applied to the internal printable container.
     */
    contentClassName?: string;
    /**
     * Called right before opening the print preview.
     */
    onBeforePrint?: () => void;
    /**
     * Called after the print window is closed.
     */
    onAfterPrint?: () => void;
    /**
     * Z-index for the dialog. Defaults to 50 (same as base Dialog) so it can be overridden when needed.
     */
    zIndex?: number;
    /**
     * Optional DOM element to render the dialog into. Defaults to a body-level portal for better layering.
     */
    portalContainer?: HTMLElement | null;
    /**
     * Force using the browser print dialog instead of Electron silent printing when available.
     */
    preferBrowserPrint?: boolean;
    /**
     * Scroll behavior: 'body' keeps page scrollable; 'paper' enables internal scroller.
     * Defaults to 'paper' for better print layout control.
     */
    scroll?: 'body' | 'paper';
    /**
     * Extra CSS appended inside the print document head.
     */
    printStyles?: string;
}
declare const DialogToPrint: React.FC<DialogToPrintProps>;
export default DialogToPrint;
//# sourceMappingURL=DialogToPrint.d.ts.map