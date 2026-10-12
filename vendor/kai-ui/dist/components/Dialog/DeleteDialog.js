"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId } from "react";
import { Trash2 } from "lucide-react";
import Dialog from "./Dialog";
import { Button, ButtonPill } from "../Button";
import Alert from "../Alert/Alert";
import DotProgress from "../DotProgress/DotProgress";
/**
 * Diálogo de confirmación de borrado, basado en el `Dialog` compartido.
 * Misma idea que `DeleteBaseForm` (ícono, mensaje, estados, DotProgress) pero con pie
 * `Cancelar` + `Eliminar` vía `actions` y errores en `alertArea`.
 */
export function DeleteDialog({ open, onClose, onConfirm, message, isSubmitting = false, title = "Confirmar eliminación", subtitle, confirmLabel = "Eliminar", cancelLabel = "Cancelar", errors = [], size: dialogSize = "custom", maxWidth = "24rem", "data-test-id": dataTestId = "delete-dialog", }) {
    const formId = useId();
    const formElementId = `delete-dialog-form-${formId}`;
    const handleSubmit = (e) => {
        e.preventDefault();
        void onConfirm();
    };
    const alertArea = errors.length > 0 ? (_jsx("div", { className: "flex flex-col gap-2", children: errors.map((err, i) => (_jsx(Alert, { variant: "error", "data-test-id": `${dataTestId}-error-${i}`, children: err }, i))) })) : null;
    return (_jsxs(Dialog, { open: open, onClose: onClose, title: title, size: dialogSize === "custom" ? "custom" : dialogSize, maxWidth: dialogSize === "custom" ? maxWidth : undefined, scroll: "body", actionsJustify: "between", "data-test-id": dataTestId, showCloseButton: false, alertArea: alertArea, actions: _jsxs(_Fragment, { children: [_jsx(Button, { type: "button", variant: "outlined", size: "md", onClick: onClose, disabled: isSubmitting, "data-test-id": `${dataTestId}-cancel`, children: cancelLabel }), _jsx(ButtonPill, { type: "submit", form: formElementId, variant: "primary", disabled: isSubmitting, className: "!bg-red-600 hover:!bg-red-700 !text-white !font-semibold", "data-test-id": `${dataTestId}-confirm`, children: isSubmitting ? (_jsx("span", { className: "inline-flex min-h-[1.25rem] items-center justify-center", children: _jsx(DotProgress, { size: 12 }) })) : (confirmLabel) })] }), children: [typeof subtitle === "string" && subtitle.trim() !== "" ? (_jsx("p", { className: "mb-4 text-sm text-muted-foreground", "data-test-id": `${dataTestId}-subtitle`, children: subtitle })) : null, _jsx("form", { id: formElementId, onSubmit: handleSubmit, className: "flex flex-col", children: _jsxs("div", { className: "mb-2 flex flex-col space-y-4", children: [_jsx("div", { className: "flex justify-center", children: _jsx("div", { className: "flex h-14 w-14 items-center justify-center rounded-full border border-red-200 bg-red-50", "aria-hidden": true, children: _jsx(Trash2, { size: 24, strokeWidth: 1.5, className: "text-red-500" }) }) }), _jsx("div", { className: "text-center text-base leading-relaxed text-foreground", "data-test-id": `${dataTestId}-message`, children: message })] }) })] }));
}
export default DeleteDialog;
//# sourceMappingURL=DeleteDialog.js.map