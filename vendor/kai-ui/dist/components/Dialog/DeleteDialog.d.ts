import React from "react";
export type DeleteDialogProps = {
    open: boolean;
    onClose: () => void;
    /** Llamar al confirmar (eliminar). Puede ser async. */
    onConfirm: () => void | Promise<void>;
    /** Texto o contenido de la advertencia. */
    message: React.ReactNode;
    isSubmitting?: boolean;
    title?: string;
    /** Línea secundaria bajo el título del `Dialog` (misma pauta que `DeleteBaseForm`). */
    subtitle?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Mostradas en `alertArea` del `Dialog` (no en el cuerpo), alineado con reglas del admin. */
    errors?: string[];
    /** Por defecto `custom` con `maxWidth` (~24rem). Podés usar `sm` u otro preset del `Dialog`. */
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "custom";
    maxWidth?: number | string;
    "data-test-id"?: string;
};
/**
 * Diálogo de confirmación de borrado, basado en el `Dialog` compartido.
 * Misma idea que `DeleteBaseForm` (ícono, mensaje, estados, DotProgress) pero con pie
 * `Cancelar` + `Eliminar` vía `actions` y errores en `alertArea`.
 */
export declare function DeleteDialog({ open, onClose, onConfirm, message, isSubmitting, title, subtitle, confirmLabel, cancelLabel, errors, size: dialogSize, maxWidth, "data-test-id": dataTestId, }: DeleteDialogProps): React.JSX.Element;
export default DeleteDialog;
//# sourceMappingURL=DeleteDialog.d.ts.map